import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { performance } from "node:perf_hooks";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldPath,
  Timestamp,
  getFirestore,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Transaction
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket();
const auth = getAuth();

const QUERY_PAGE_LIMIT = 400;
const DELETE_BATCH_LIMIT = 400;
const EXPORT_DOWNLOAD_URL_TTL_MS = 15 * 60 * 1000;
const EXPORT_PACKAGE_TTL_MS = 24 * 60 * 60 * 1000;
const STORYTIME_PRIVACY_POLICY_VERSION = "urai-privacy-0.2.0-staging-scaffold";
const STORYTIME_EXPORT_SCHEMA_VERSION = "storytime-export-v1";
const STORYTIME_EXPORT_INVENTORY_VERSION = "storytime-owner-ledger-inventory-v4";
const STORYTIME_DELETION_PLAN_SCHEMA_VERSION = "storytime-deletion-plan-v1";
const STORYTIME_PRIVACY_RECEIPT_SCHEMA_VERSION = "storytime-privacy-operation-receipt-v1";

const ExportRequestSchema = z.object({
  privacyRequestId: z.string().min(1).max(300).regex(/^[^/]+$/)
});

const DeletionPlanRequestSchema = z.object({
  privacyRequestId: z.string().min(1).max(300)
});

const DeletionExecuteSchema = z.object({
  privacyRequestId: z.string().min(1).max(300),
  expectedPlanHash: z.string().regex(/^[0-9a-f]{64}$/),
  confirmation: z.literal("DELETE_STORYTIME_DATA")
});

const redactedFields = new Set([
  "password",
  "token",
  "secret",
  "apikey",
  "privatekey",
  "refreshtoken",
  "idtoken",
  "sessioncookie"
]);

// Retain safety/spend ledgers until governed reconciliation and retention authority exist.
// Include owner-scoped rows in exports; never erase budget or abuse controls implicitly.
const accountRetainedLedgerCollections = [
  "storytimeSafetyReportCounters",
  "storytimeProviderBudgetCounters",
  "storytimeProviderBudgetReservations",
  "storytimeProviderDeadLetters"
] as const;

const accountUserCollections = [
  ...accountRetainedLedgerCollections,
  "storySessions",
  "storyVersions",
  "storyDrafts",
  "storyChapters",
  "storyMoments",
  "memoryScenes",
  "narratorScripts",
  "ritualStorycards",
  "userStoryPreferences",
  "storyExports",
  "voiceoverJobs",
  "timelineReplayEvents",
  "emotionalArcSummaries",
  "relationshipStoryThreads",
  "weeklyStoryScrolls",
  "monthlyStoryScrolls",
  "storyAnalyticsEvents",
  "moderation",
  "storytimeUsageCounters",
  "storyGenerationRequests",
  "storyArchiveSnapshots",
  "storySafetyReports",
  "publicStoryShareControls"
] as const;

const accountOwnerCollections = [
  "finiteTimeCanonRegistries",
  "finiteTimeCanonRegistryRevisions",
  "finiteTimeShotGraphs"
] as const;

const sessionScalarCollections = [
  "storyVersions",
  "storyChapters",
  "storyMoments",
  "memoryScenes",
  "narratorScripts",
  "ritualStorycards",
  "storyExports",
  "voiceoverJobs",
  "timelineReplayEvents",
  "emotionalArcSummaries",
  "relationshipStoryThreads",
  "storyAnalyticsEvents",
  "storyGenerationRequests",
  "storySafetyReports",
  "publicStoryShareControls"
] as const;

const sessionArrayCollections = [
  "weeklyStoryScrolls",
  "monthlyStoryScrolls",
  "storyArchiveSnapshots"
] as const;

type PrivacyScope = "account" | "story_session";

type StoredPrivacyRequest = {
  schemaVersion?: string;
  confirmation?: boolean;
  createdAt?: string;
  exportAuthorizationExpiresAt?: string | null;
  userId: string;
  type: "export" | "deletion";
  scope: PrivacyScope;
  sessionId?: string | null;
  status?: string;
  executionState?: string;
  exportPath?: string | null;
  exportManifestPath?: string | null;
  exportPackageSha256?: string | null;
  exportCompleteness?: string | null;
  exportInventoryVersion?: string | null;
  exportBlockers?: string[];
  exportManifestSha256?: string | null;
  exportFileSha256?: string | null;
  exportSourceInventorySha256?: string | null;
  exportSourceSessionIds?: string[];
  exportExpiresAt?: string | null;
  completionReceiptId?: string | null;
  deletionPlanHash?: string | null;
  deletionPlanId?: string | null;
};

type DeletionPlan = {
  schemaVersion: typeof STORYTIME_DELETION_PLAN_SCHEMA_VERSION;
  privacyRequestId: string;
  userId: string;
  scope: PrivacyScope;
  sessionId: string | null;
  generatedAt: string;
  targets: Record<string, string[]>;
  storageObjects: string[];
  retainedData: string[];
  executionBlockers: string[];
  completionBlockers: string[];
  legalHold: boolean;
  deleteAuthUser: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function sha256(value: unknown) {
  const normalized = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha256").update(normalized).digest("hex");
}

function requireVerifiedOwner(request: { auth?: { uid: string; token?: { email_verified?: unknown } } | null }) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (request.auth?.token?.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Verify the account email before using Storytime privacy operations.");
  }
  return uid;
}

function requireAdmin(request: { auth?: { uid: string; token?: Record<string, unknown> } | null }) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (request.auth?.token?.admin !== true && request.auth?.token?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin authority is required for destructive Storytime deletion.");
  }
  return uid;
}

function portable(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(portable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !redactedFields.has(key.toLowerCase()))
        .map(([key, nested]) => [key, portable(nested)])
    );
  }
  return value;
}

function stablePortable(value: unknown): unknown {
  const normalized = portable(value);
  if (Array.isArray(normalized)) return normalized.map(stablePortable);
  if (normalized && typeof normalized === "object") {
    return Object.fromEntries(Object.entries(normalized as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stablePortable(nested)]));
  }
  return normalized;
}

function exportRequestAuthority(privacyRequestId: string, data: StoredPrivacyRequest) {
  const createdAt = Date.parse(data.createdAt ?? "");
  const expiresAt = Date.parse(data.exportAuthorizationExpiresAt ?? "");
  if (data.schemaVersion !== "storytime-privacy-request-v1" || data.confirmation !== true
    || !["requested", "processing", "completed"].includes(data.status ?? "")
    || !["account", "story_session"].includes(data.scope)
    || (data.scope === "story_session" && !data.sessionId)
    || !Number.isFinite(createdAt) || createdAt > Date.now()
    || !Number.isFinite(expiresAt) || expiresAt <= Date.now()
    || expiresAt > createdAt + EXPORT_PACKAGE_TTL_MS) {
    throw new HttpsError("failed-precondition", "Create a fresh, explicitly confirmed Storytime export request.");
  }
  return { expiresAt, hash: sha256(stablePortable({ privacyRequestId, userId: data.userId,
    scope: data.scope, sessionId: data.sessionId ?? null, createdAt, expiresAt, confirmation: true })) };
}

type ExportCollections = Record<string, Array<{ id: string; data: DocumentData }>>;

function sourceInventoryHash(collections: ExportCollections, family: { memberships: unknown[]; truncated: boolean }) {
  // Operation status and download audits are not source content. The separate
  // live request/deletion gates below govern those records.
  const sources = Object.fromEntries(Object.entries(collections).filter(([name]) => name !== "privacyRequests"));
  return sha256(stablePortable({ collections: sources, family }));
}

function sourceSessionIds(collections: ExportCollections) {
  const ids = new Set((collections.storySessions ?? []).map((row) => row.id));
  for (const [name, rows] of Object.entries(collections)) for (const { data } of rows) {
    if (name === "privacyRequests") continue;
    if (typeof data.sessionId === "string") ids.add(data.sessionId);
    if (Array.isArray(data.sessionIds)) for (const id of data.sessionIds) if (typeof id === "string") ids.add(id);
  }
  return [...ids].sort();
}

async function assertNoRelevantDeletion(data: StoredPrivacyRequest, sessions: string[], transaction?: Transaction) {
  const requests = await listByField("privacyRequests", "userId", data.userId, transaction);
  if (requests.some(({ data: deletion }) => deletion.type === "deletion"
    && !["cancelled", "rejected"].includes(String(deletion.status ?? ""))
    && (deletion.scope === "account" || (deletion.scope === "story_session"
      && (deletion.sessionId === data.sessionId || sessions.includes(String(deletion.sessionId))))))) {
    throw new HttpsError("failed-precondition", "Storytime export is unavailable while relevant deletion authority exists.");
  }
}

async function currentExportSources(data: StoredPrivacyRequest, transaction?: Transaction) {
  const collections = data.scope === "account"
    ? await collectAccountRows(data.userId, transaction)
    : await collectSessionRows(data.userId, String(data.sessionId), false, transaction);
  const family = data.scope === "account"
    ? await familyMemberships(data.userId, transaction)
    : { memberships: [], truncated: false };
  const sessions = sourceSessionIds(collections);
  await assertNoRelevantDeletion(data, sessions, transaction);
  return { collections, family, sessions, hash: sourceInventoryHash(collections, family) };
}

async function listByField(collectionName: string, field: string | FieldPath, value: unknown, transaction?: Transaction) {
  const rows: Array<{ id: string; data: DocumentData }> = [];
  let cursor: QueryDocumentSnapshot | undefined;

  while (true) {
    let query = db.collection(collectionName)
      .where(field, "==", value)
      .orderBy(FieldPath.documentId())
      .limit(QUERY_PAGE_LIMIT);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = transaction ? await transaction.get(query) : await query.get();
    rows.push(...snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })));
    if (snapshot.size < QUERY_PAGE_LIMIT) break;
    cursor = snapshot.docs.at(-1);
    if (!cursor) break;
  }

  return rows;
}

async function listByArrayContains(collectionName: string, field: string, value: string, transaction?: Transaction) {
  const rows: Array<{ id: string; data: DocumentData }> = [];
  let cursor: QueryDocumentSnapshot | undefined;

  while (true) {
    let query = db.collection(collectionName)
      .where(field, "array-contains", value)
      .orderBy(FieldPath.documentId())
      .limit(QUERY_PAGE_LIMIT);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = transaction ? await transaction.get(query) : await query.get();
    rows.push(...snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })));
    if (snapshot.size < QUERY_PAGE_LIMIT) break;
    cursor = snapshot.docs.at(-1);
    if (!cursor) break;
  }

  return rows;
}

async function readPrivacyRequest(privacyRequestId: string, transaction?: Transaction) {
  const ref = db.collection("privacyRequests").doc(privacyRequestId);
  const snapshot = transaction ? await transaction.get(ref) : await ref.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Storytime privacy request was not found.");
  return { ref, data: snapshot.data() as StoredPrivacyRequest };
}

async function readOwnedPrivacyRequest(privacyRequestId: string, userId: string, type: "export" | "deletion", transaction?: Transaction) {
  const request = await readPrivacyRequest(privacyRequestId, transaction);
  if (request.data.userId !== userId || request.data.type !== type) {
    throw new HttpsError("permission-denied", "Storytime privacy request is unavailable.");
  }
  return request;
}

async function assertOwnedSession(sessionId: string, userId: string, allowDeletedSession = false, transaction?: Transaction) {
  const ref = db.collection("storySessions").doc(sessionId);
  const snapshot = transaction ? await transaction.get(ref) : await ref.get();
  if (!snapshot.exists && allowDeletedSession) return null;
  if (!snapshot.exists || snapshot.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "You do not own that Storytime session.");
  }
  return { id: snapshot.id, data: snapshot.data() ?? {} };
}

async function familyMemberships(userId: string, transaction?: Transaction) {
  const rolePath = new FieldPath("members", userId, "role");
  const query = db.collection("families")
    .where(rolePath, "in", ["owner", "guardian", "viewer"])
    .limit(100);
  const snapshot = transaction ? await transaction.get(query) : await query.get();
  return {
    memberships: snapshot.docs.map((doc) => ({
      familyId: doc.id,
      role: String(doc.data()?.members?.[userId]?.role ?? "unknown")
    })),
    truncated: snapshot.size >= 100
  };
}

async function activeLegalHold(userId: string) {
  const user = await db.collection("users").doc(userId).get();
  if (user.exists && user.data()?.legalHold === true) return true;

  // Keep legal-hold lookup executable without requiring a hidden composite index.
  // We query the subject key only, then evaluate active status in trusted server code.
  const byUid = await db.collection("legalHoldRecords")
    .where("uid", "==", userId)
    .limit(25)
    .get();
  if (byUid.docs.some((doc) => doc.data()?.status === "active")) return true;

  const byUserId = await db.collection("legalHoldRecords")
    .where("userId", "==", userId)
    .limit(25)
    .get();
  return byUserId.docs.some((doc) => doc.data()?.status === "active");
}

function externalArtifactPointers(rows: Array<{ collection: string; id: string; data: DocumentData }>) {
  const pointerFields = [
    "providerArtifactId",
    "providerAssetId",
    "providerJobId",
    "externalProviderJobId",
    "externalAssetId",
    "providerStoragePath",
    "providerDownloadId"
  ];
  const blockers: string[] = [];

  for (const row of rows) {
    const pointers = pointerFields.filter((field) => {
      const value = row.data[field];
      return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
    });
    if (pointers.length > 0) {
      blockers.push(`${row.collection}/${row.id} has external provider artifact references: ${pointers.join(", ")}`);
    }
  }

  return blockers;
}

async function authAccountMetadata(userId: string) {
  try {
    const user = await auth.getUser(userId);
    return {
      uid: user.uid,
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      createdAt: user.metadata.creationTime ?? null,
      lastSignInAt: user.metadata.lastSignInTime ?? null,
      providerIds: user.providerData.map((provider) => provider.providerId).sort()
    };
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    if (code === "auth/user-not-found") return null;
    throw error;
  }
}

async function collectAccountRows(userId: string, transaction?: Transaction) {
  const collections: Record<string, Array<{ id: string; data: DocumentData }>> = {};

  const userRef = db.collection("users").doc(userId);
  const user = transaction ? await transaction.get(userRef) : await userRef.get();
  collections.users = user.exists ? [{ id: user.id, data: user.data() ?? {} }] : [];

  for (const name of accountUserCollections) {
    collections[name] = await listByField(name, "userId", userId, transaction);
  }
  for (const name of accountOwnerCollections) {
    collections[name] = await listByField(name, "ownerId", userId, transaction);
  }
  collections.privacyRequests = await listByField("privacyRequests", "userId", userId, transaction);

  const publicShareIds = collections.publicStoryShareControls.map((row) => row.id);
  const publicShares: Array<{ id: string; data: DocumentData }> = [];
  for (const shareId of publicShareIds) {
    const shareRef = db.collection("publicStoryShares").doc(shareId);
    const snapshot = transaction ? await transaction.get(shareRef) : await shareRef.get();
    if (snapshot.exists) publicShares.push({ id: snapshot.id, data: snapshot.data() ?? {} });
  }
  collections.publicStoryShares = publicShares;

  return collections;
}

async function collectSessionRows(userId: string, sessionId: string, allowDeletedSession = false, transaction?: Transaction) {
  const session = await assertOwnedSession(sessionId, userId, allowDeletedSession, transaction);
  const collections: Record<string, Array<{ id: string; data: DocumentData }>> = {
    storySessions: session ? [{ id: session.id, data: session.data }] : []
  };

  for (const name of sessionScalarCollections) {
    const rows = await listByField(name, "sessionId", sessionId, transaction);
    collections[name] = rows.filter((row) => row.data.userId === undefined || row.data.userId === userId);
  }
  for (const name of sessionArrayCollections) {
    const rows = await listByArrayContains(name, "sessionIds", sessionId, transaction);
    collections[name] = rows.filter((row) => row.data.userId === undefined || row.data.userId === userId);
  }

  const requestId = typeof session?.data.requestId === "string" ? session.data.requestId : null;
  collections.moderation = requestId
    ? (await listByField("moderation", "requestId", requestId, transaction)).filter((row) => row.data.userId === userId)
    : [];

  const publicShareIds = (collections.publicStoryShareControls ?? []).map((row) => row.id);
  const publicShares: Array<{ id: string; data: DocumentData }> = [];
  for (const shareId of publicShareIds) {
    const shareRef = db.collection("publicStoryShares").doc(shareId);
    const snapshot = transaction ? await transaction.get(shareRef) : await shareRef.get();
    if (snapshot.exists) publicShares.push({ id: snapshot.id, data: snapshot.data() ?? {} });
  }
  collections.publicStoryShares = publicShares;

  return collections;
}

function recordCounts(collections: Record<string, Array<{ id: string; data: DocumentData }>>) {
  return Object.fromEntries(Object.entries(collections).map(([name, rows]) => [name, rows.length]));
}

function flattenExternalRows(collections: Record<string, Array<{ id: string; data: DocumentData }>>) {
  const watched = ["storyExports", "voiceoverJobs"];
  return watched.flatMap((collection) =>
    (collections[collection] ?? []).map((row) => ({ collection, id: row.id, data: row.data }))
  );
}

function serializeCollections(collections: Record<string, Array<{ id: string; data: DocumentData }>>) {
  return Object.fromEntries(
    Object.entries(collections).map(([name, rows]) => [
      name,
      rows.map((row) => ({ id: row.id, ...(portable(row.data) as Record<string, unknown>) }))
    ])
  );
}

async function exportStorageObjects(userId: string) {
  const prefix = `storytime-exports/${sha256(userId)}/`;
  const [files] = await bucket.getFiles({ prefix });
  return files.map((file) => file.name).sort();
}

async function writeJson(path: string, value: unknown) {
  const body = JSON.stringify(value, null, 2);
  const digest = sha256(body);
  await bucket.file(path).save(body, {
    resumable: false,
    contentType: "application/json",
    metadata: {
      cacheControl: "private, max-age=0, no-store",
      metadata: { sha256: digest }
    }
  });
  return { path, sha256: digest, bytes: Buffer.byteLength(body, "utf8") };
}

async function writeReceipt(args: {
  userId: string;
  privacyRequestId: string;
  type: "export" | "deletion_mutation" | "deletion_completed";
  metadata: Record<string, unknown>;
}) {
  const ref = db.collection("privacyOperationReceipts").doc();
  const createdAt = nowIso();
  const payload = {
    schemaVersion: STORYTIME_PRIVACY_RECEIPT_SCHEMA_VERSION,
    sourceRepo: "LifeLoggerAI/urai-storytime",
    userId: args.userId,
    privacyRequestId: args.privacyRequestId,
    type: args.type,
    metadata: stablePortable(args.metadata),
    createdAt
  };
  await ref.set({ ...payload, integrityHash: sha256({ id: ref.id, ...payload }) });
  return ref.id;
}

function normalizeDeletionPlan(plan: DeletionPlan) {
  return {
    schemaVersion: plan.schemaVersion,
    privacyRequestId: plan.privacyRequestId,
    userId: plan.userId,
    scope: plan.scope,
    sessionId: plan.sessionId,
    targets: Object.fromEntries(
      Object.entries(plan.targets)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, ids]) => [name, [...ids].sort()])
    ),
    storageObjects: [...plan.storageObjects].sort(),
    retainedData: [...plan.retainedData].sort(),
    executionBlockers: [...plan.executionBlockers].sort(),
    completionBlockers: [...plan.completionBlockers].sort(),
    legalHold: plan.legalHold,
    deleteAuthUser: plan.deleteAuthUser
  };
}

function deletionPlanHash(plan: DeletionPlan) {
  return sha256(normalizeDeletionPlan(plan));
}

async function buildDeletionPlan(privacyRequestId: string, request: StoredPrivacyRequest, allowDeletedSession = false): Promise<DeletionPlan> {
  const userId = request.userId;
  const scope = request.scope;
  const sessionId = request.sessionId ?? null;
  const collections = scope === "account"
    ? await collectAccountRows(userId)
    : await collectSessionRows(userId, String(sessionId), allowDeletedSession);

  const retainedData = [
    "privacyRequests",
    "privacyDeletionPlans",
    "privacyOperationReceipts",
    "legalHoldRecords",
    ...accountRetainedLedgerCollections
  ];

  const targets: Record<string, string[]> = {};
  const executionBlockers: string[] = [];
  for (const [name, rows] of Object.entries(collections)) {
    if (retainedData.includes(name)) {
      if (rows.length > 0 && accountRetainedLedgerCollections.some((collection) => collection === name)) {
        executionBlockers.push(`account_ledger_retention_review_required:${name}`);
      }
      continue;
    }

    if (scope === "story_session" && sessionArrayCollections.includes(name as (typeof sessionArrayCollections)[number])) {
      const deletable: string[] = [];
      for (const row of rows) {
        const linkedSessionIds = Array.isArray(row.data.sessionIds)
          ? row.data.sessionIds.filter((value: unknown): value is string => typeof value === "string")
          : [];
        if (linkedSessionIds.length <= 1) {
          deletable.push(row.id);
        } else {
          executionBlockers.push(`shared_aggregate_recompute_required:${name}/${row.id}`);
        }
      }
      targets[name] = deletable.sort();
      continue;
    }

    targets[name] = rows.map((row) => row.id).sort();
  }

  const storageObjects = scope === "account" ? await exportStorageObjects(userId) : [];
  const completionBlockers: string[] = [];
  const legalHold = await activeLegalHold(userId);
  if (legalHold) executionBlockers.push("active_legal_hold");

  if (scope === "account") {
    const family = await familyMemberships(userId);
    if (family.memberships.length > 0) {
      executionBlockers.push("family_or_child_data_requires_urai_privacy_review");
    }
    if (family.truncated) executionBlockers.push("family_membership_scan_truncated");
    if (process.env.STORYTIME_FIREBASE_ISOLATED !== "true") {
      executionBlockers.push("storytime_firebase_isolation_not_certified");
    }
  }

  const mediaRows = flattenExternalRows(collections);
  executionBlockers.push(...externalArtifactPointers(mediaRows));
  if (mediaRows.length > 0) {
    executionBlockers.push("story_media_storage_cleanup_not_certified");
  }

  if (process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY !== "true") {
    completionBlockers.push("backup_expiry_policy_not_certified");
  }

  return {
    schemaVersion: STORYTIME_DELETION_PLAN_SCHEMA_VERSION,
    privacyRequestId,
    userId,
    scope,
    sessionId,
    generatedAt: nowIso(),
    targets,
    storageObjects,
    retainedData,
    executionBlockers: [...new Set(executionBlockers)].sort(),
    completionBlockers: [...new Set(completionBlockers)].sort(),
    legalHold,
    deleteAuthUser: scope === "account"
  };
}

async function deleteTargets(plan: DeletionPlan) {
  const deletedCounts: Record<string, number> = {};

  for (const [collectionName, ids] of Object.entries(plan.targets)) {
    deletedCounts[collectionName] = 0;
    for (let offset = 0; offset < ids.length; offset += DELETE_BATCH_LIMIT) {
      const batch = db.batch();
      const slice = ids.slice(offset, offset + DELETE_BATCH_LIMIT);
      for (const id of slice) batch.delete(db.collection(collectionName).doc(id));
      await batch.commit();
      deletedCounts[collectionName] += slice.length;
    }
  }

  for (let offset = 0; offset < plan.storageObjects.length; offset += DELETE_BATCH_LIMIT) {
    const slice = plan.storageObjects.slice(offset, offset + DELETE_BATCH_LIMIT);
    await Promise.all(slice.map((path) => bucket.file(path).delete({ ignoreNotFound: true })));
  }
  deletedCounts.storageObjects = plan.storageObjects.length;

  if (plan.deleteAuthUser) {
    try {
      await auth.deleteUser(plan.userId);
      deletedCounts.authUsers = 1;
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      if (code === "auth/user-not-found") {
        deletedCounts.authUsers = 0;
      } else {
        throw error;
      }
    }
  }

  return deletedCounts;
}

function remainingDeletionTargets(plan: DeletionPlan) {
  return Object.entries(plan.targets)
    .filter(([, ids]) => ids.length > 0)
    .map(([name, ids]) => `${name}:${ids.length}`);
}

export const processStorytimeExportRequest = onCall(async (request) => {
  const userId = requireVerifiedOwner(request);
  const input = ExportRequestSchema.parse(request.data);
  const privacyRequest = await readOwnedPrivacyRequest(input.privacyRequestId, userId, "export");
  const requestAuthority = exportRequestAuthority(input.privacyRequestId, privacyRequest.data);
  const sources = await currentExportSources(privacyRequest.data);

  if (
    privacyRequest.data.executionState === "completed"
    && privacyRequest.data.exportInventoryVersion === STORYTIME_EXPORT_INVENTORY_VERSION
    && privacyRequest.data.exportPath
    && privacyRequest.data.exportManifestPath
    && privacyRequest.data.exportPackageSha256
    && privacyRequest.data.exportSourceInventorySha256 === sources.hash
    && Date.parse(privacyRequest.data.exportExpiresAt ?? "") > Date.now()
    && privacyRequest.data.completionReceiptId
  ) {
    return {
      privacyRequestId: input.privacyRequestId,
      status: "completed",
      completeness: privacyRequest.data.exportCompleteness ?? "complete_for_storytime_owned_data",
      blockers: privacyRequest.data.exportBlockers ?? [],
      packageSha256: privacyRequest.data.exportPackageSha256,
      reused: true
    };
  }

  const scope = privacyRequest.data.scope;
  const sessionId = privacyRequest.data.sessionId ?? null;
  const { collections, family } = sources;
  const externalBlockers = externalArtifactPointers(flattenExternalRows(collections));
  const blockers = [
    ...(family.memberships.length > 0 ? ["family_or_child_data_requires_urai_privacy_review"] : []),
    ...(family.truncated ? ["family_membership_scan_truncated"] : []),
    ...externalBlockers
  ];

  const generatedAt = nowIso();
  const exportExpiresAt = new Date(Math.min(Date.parse(generatedAt) + EXPORT_PACKAGE_TTL_MS, requestAuthority.expiresAt)).toISOString();
  const authAccount = scope === "account" ? await authAccountMetadata(userId) : null;
  const exportPackage = {
    schemaVersion: STORYTIME_EXPORT_SCHEMA_VERSION,
    inventoryVersion: STORYTIME_EXPORT_INVENTORY_VERSION,
    policyVersion: STORYTIME_PRIVACY_POLICY_VERSION,
    sourceRepo: "LifeLoggerAI/urai-storytime",
    privacyRequestId: input.privacyRequestId,
    userId,
    scope,
    sessionId,
    generatedAt,
    expiresAt: exportExpiresAt,
    sourceInventorySha256: sources.hash,
    dataClassesIncluded: Object.keys(collections).sort(),
    familyMembershipSummary: family.memberships,
    authAccount,
    blockers,
    collections: serializeCollections(collections)
  };
  const packageDigest = sha256(exportPackage);
  const prefix = `storytime-exports/${sha256(userId)}/${input.privacyRequestId}`;
  const exportFile = await writeJson(`${prefix}/storytime-export.json`, exportPackage);
  const manifest = {
    schemaVersion: "storytime-export-manifest-v1",
    privacyRequestId: input.privacyRequestId,
    userIdHash: sha256(userId),
    createdAt: generatedAt,
    policyVersion: STORYTIME_PRIVACY_POLICY_VERSION,
    packageSha256: packageDigest,
    fileSha256: exportFile.sha256,
    sourceInventorySha256: sources.hash,
    expiresAt: exportExpiresAt,
    recordCounts: recordCounts(collections),
    blockers,
    completeness: blockers.length === 0 ? "complete_for_storytime_owned_data" : "partial_review_required"
  };
  const manifestFile = await writeJson(`${prefix}/manifest.json`, manifest);
  const receiptId = await writeReceipt({
    userId,
    privacyRequestId: input.privacyRequestId,
    type: "export",
    metadata: {
      packageSha256: packageDigest,
      fileSha256: exportFile.sha256,
      sourceInventorySha256: sources.hash,
      sourceSessionIds: sources.sessions,
      requestAuthorityHash: requestAuthority.hash,
      exportExpiresAt,
      exportPath: exportFile.path,
      manifestPath: manifestFile.path,
      completeness: manifest.completeness,
      blockers
    }
  });

  await db.runTransaction(async (transaction) => {
    const current = await readOwnedPrivacyRequest(input.privacyRequestId, userId, "export", transaction);
    const currentAuthority = exportRequestAuthority(input.privacyRequestId, current.data);
    const currentSources = await currentExportSources(current.data, transaction);
    if (currentAuthority.hash !== requestAuthority.hash || currentSources.hash !== sources.hash
      || Date.parse(exportExpiresAt) <= Date.now()) {
      throw new HttpsError("failed-precondition", "Storytime export authority or source inventory changed during packaging.");
    }
    transaction.update(privacyRequest.ref, {
    status: blockers.length === 0 ? "completed" : "processing",
    executionState: blockers.length === 0 ? "completed" : "review_required",
    exportPath: exportFile.path,
    exportManifestPath: manifestFile.path,
    exportPackageSha256: packageDigest,
    exportManifestSha256: manifestFile.sha256,
    exportFileSha256: exportFile.sha256,
    exportSourceInventorySha256: sources.hash,
    exportSourceSessionIds: sources.sessions,
    exportExpiresAt,
    exportCompleteness: manifest.completeness,
    exportInventoryVersion: STORYTIME_EXPORT_INVENTORY_VERSION,
    exportBlockers: blockers,
    completionReceiptId: blockers.length === 0 ? receiptId : null,
    updatedAt: generatedAt
    });
  });

  auditLog({
    event: "privacy_export_packaged",
    userId,
    errorCode: blockers.length === 0 ? "complete" : "review_required"
  });

  return {
    privacyRequestId: input.privacyRequestId,
    status: blockers.length === 0 ? "completed" : "processing",
    completeness: manifest.completeness,
    blockers,
    recordCounts: manifest.recordCounts,
    packageSha256: packageDigest,
    reused: false
  };
});

async function readStorytimeExportAuthority(transaction: Transaction, userId: string, privacyRequestId: string) {
  const privacyRequest = await readOwnedPrivacyRequest(privacyRequestId, userId, "export", transaction);
  const data = privacyRequest.data;
  if (data.exportInventoryVersion !== STORYTIME_EXPORT_INVENTORY_VERSION) {
    throw new HttpsError("failed-precondition", "Regenerate the Storytime export using the current privacy inventory before download.");
  }
  if (data.exportCompleteness !== "complete_for_storytime_owned_data") {
    throw new HttpsError("failed-precondition", "Storytime export requires privacy review before download can be authorized.");
  }
  const requestAuthority = exportRequestAuthority(privacyRequestId, data);
  const packageExpiresAt = Date.parse(data.exportExpiresAt ?? "");
  const prefix = `storytime-exports/${sha256(userId)}/${privacyRequestId}`;
  const path = `${prefix}/storytime-export.json`;
  if (data.status !== "completed" || data.executionState !== "completed"
    || data.exportPath !== path || data.exportManifestPath !== `${prefix}/manifest.json`
    || !/^[0-9a-f]{64}$/.test(data.exportPackageSha256 ?? "")
    || !/^[0-9a-f]{64}$/.test(data.exportFileSha256 ?? "")
    || !/^[0-9a-f]{64}$/.test(data.exportSourceInventorySha256 ?? "")
    || !Array.isArray(data.exportSourceSessionIds)
    || !data.completionReceiptId || data.completionReceiptId.includes("/")
    || !Array.isArray(data.exportBlockers) || data.exportBlockers.length > 0
    || !Number.isFinite(packageExpiresAt) || packageExpiresAt <= Date.now()
    || packageExpiresAt > requestAuthority.expiresAt) {
    throw new HttpsError("failed-precondition", "Storytime export completion authority is unavailable.");
  }
  const receiptRef = db.collection("privacyOperationReceipts").doc(data.completionReceiptId);
  const receiptSnapshot = await transaction.get(receiptRef);
  const receipt = receiptSnapshot.data() ?? {};
  const metadata = receipt.metadata ?? {};
  const payload = { schemaVersion: receipt.schemaVersion, sourceRepo: receipt.sourceRepo, userId: receipt.userId,
    privacyRequestId: receipt.privacyRequestId, type: receipt.type,
    metadata: stablePortable(metadata), createdAt: receipt.createdAt };
  if (!receiptSnapshot.exists || receipt.schemaVersion !== STORYTIME_PRIVACY_RECEIPT_SCHEMA_VERSION
    || receipt.sourceRepo !== "LifeLoggerAI/urai-storytime" || receipt.userId !== userId
    || receipt.privacyRequestId !== privacyRequestId || receipt.type !== "export"
    || receipt.integrityHash !== sha256({ id: receiptRef.id, ...payload })
    || metadata.packageSha256 !== data.exportPackageSha256 || metadata.fileSha256 !== data.exportFileSha256
    || metadata.exportPath !== path || metadata.manifestPath !== data.exportManifestPath
    || metadata.sourceInventorySha256 !== data.exportSourceInventorySha256
    || metadata.requestAuthorityHash !== requestAuthority.hash || metadata.exportExpiresAt !== data.exportExpiresAt
    || metadata.completeness !== "complete_for_storytime_owned_data"
    || !Array.isArray(metadata.blockers) || metadata.blockers.length > 0
    || sha256(metadata.sourceSessionIds) !== sha256(data.exportSourceSessionIds)) {
    throw new HttpsError("failed-precondition", "Storytime export completion receipt is unavailable.");
  }
  const sources = await currentExportSources(data, transaction);
  if (sources.hash !== data.exportSourceInventorySha256
    || sha256(sources.sessions) !== sha256(data.exportSourceSessionIds)) {
    throw new HttpsError("failed-precondition", "Storytime source inventory changed. Regenerate the export before download.");
  }
  if (Date.now() >= Math.min(packageExpiresAt, requestAuthority.expiresAt)) {
    throw new HttpsError("failed-precondition", "Storytime export authority expired during verification.");
  }
  const identityHash = sha256(stablePortable({ privacyRequestId, userId, path,
    packageSha256: data.exportPackageSha256, fileSha256: data.exportFileSha256,
    sourceInventorySha256: sources.hash, receiptId: receiptRef.id, receiptHash: receipt.integrityHash,
    requestAuthorityHash: requestAuthority.hash, packageExpiresAt }));
  return { data, path, identityHash, packageExpiresAt, authorizationExpiresAt: requestAuthority.expiresAt };
}

function storytimeExportEndpoint() {
  const projectId = getApps().find((app) => app.name === "[DEFAULT]")?.options.projectId ?? process.env.GCLOUD_PROJECT;
  if (!projectId || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(projectId)) {
    throw new HttpsError("failed-precondition", "The current Storytime Firebase project is unavailable.");
  }
  return `https://us-central1-${projectId}.cloudfunctions.net/downloadStorytimeExportPackage`;
}

async function exportObjectGeneration(authority: Awaited<ReturnType<typeof readStorytimeExportAuthority>>) {
  const [metadata] = await bucket.file(authority.path).getMetadata();
  const bytes = Number(metadata.size);
  if (metadata.metadata?.sha256 !== authority.data.exportFileSha256 || !metadata.generation
    || !Number.isSafeInteger(bytes) || bytes <= 0) {
    throw new HttpsError("failed-precondition", "Storytime export object integrity is unavailable.");
  }
  return { generation: metadata.generation, bytes };
}

function downloadAudit(transaction: Transaction, userId: string, privacyRequestId: string,
  action: "export_download_url_created" | "export_download_authorized", identityHash: string, expiresAt: number) {
  const ref = db.collection("privacyOperationReceipts").doc();
  const payload = { schemaVersion: STORYTIME_PRIVACY_RECEIPT_SCHEMA_VERSION, sourceRepo: "LifeLoggerAI/urai-storytime",
    userId, privacyRequestId, type: action, createdAt: nowIso(),
    metadata: { identityHash, expiresAt, transport: "authenticated-function" } };
  transaction.create(ref, { ...payload, integrityHash: sha256(stablePortable({ id: ref.id, ...payload })) });
  return ref.id;
}

export const getStorytimeExportDownloadUrl = onCall(async (request) => {
  const userId = requireVerifiedOwner(request);
  const input = ExportRequestSchema.parse(request.data);
  const authority = await db.runTransaction((transaction) => readStorytimeExportAuthority(transaction, userId, input.privacyRequestId));
  await exportObjectGeneration(authority);
  const expiresAt = Math.min(Date.now() + EXPORT_DOWNLOAD_URL_TTL_MS, authority.packageExpiresAt, authority.authorizationExpiresAt);
  const url = new URL(storytimeExportEndpoint());
  url.searchParams.set("privacyRequestId", input.privacyRequestId);
  url.searchParams.set("expiresAt", String(expiresAt));
  url.searchParams.set("authorityHash", authority.identityHash);
  const auditId = await db.runTransaction(async (transaction) => {
    const current = await readStorytimeExportAuthority(transaction, userId, input.privacyRequestId);
    if (current.identityHash !== authority.identityHash || expiresAt <= Date.now()) {
      throw new HttpsError("failed-precondition", "Storytime export authority changed before issuing the download.");
    }
    return downloadAudit(transaction, userId, input.privacyRequestId, "export_download_url_created", current.identityHash, expiresAt);
  });
  auditLog({ event: "privacy_export_download_url_created", userId });
  return { privacyRequestId: input.privacyRequestId, url: url.toString(), requiresAuthorization: true,
    expiresAt: new Date(expiresAt).toISOString(), packageExpiresAt: new Date(authority.packageExpiresAt).toISOString(),
    completeness: authority.data.exportCompleteness, packageSha256: authority.data.exportPackageSha256, auditId };
});

const ExportDeliverySchema = ExportRequestSchema.extend({
  expiresAt: z.coerce.number().finite().int().positive(),
  authorityHash: z.string().regex(/^[0-9a-f]{64}$/)
});

export const downloadStorytimeExportPackage = onRequest({ cors: true, timeoutSeconds: 540, memory: "1GiB" }, async (request, response) => {
  const deliveryStarted = Date.now(), deliveryStartedMonotonic = performance.now();
  response.set({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
  if (request.method !== "GET") { response.set("Allow", "GET").status(405).json({ error: "method_not_allowed" }); return; }
  try {
    const bearer = request.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!bearer) throw new HttpsError("unauthenticated", "Authentication is required.");
    let verified;
    try { verified = await auth.verifyIdToken(bearer, true); }
    catch { throw new HttpsError("unauthenticated", "Current authentication is required."); }
    const userId = requireVerifiedOwner({ auth: { uid: verified.uid, token: verified } });
    const input = ExportDeliverySchema.parse(request.query);
    const authority = await db.runTransaction((transaction) => readStorytimeExportAuthority(transaction, userId, input.privacyRequestId));
    if (authority.identityHash !== input.authorityHash || input.expiresAt <= Date.now()
      || input.expiresAt > Math.min(Date.now() + EXPORT_DOWNLOAD_URL_TTL_MS, authority.packageExpiresAt, authority.authorizationExpiresAt)) {
      throw new HttpsError("failed-precondition", "Storytime export download authority expired or changed.");
    }
    const objectVersion = await exportObjectGeneration(authority);
    const monotonicDeadline = deliveryStartedMonotonic + Math.min(500_000, input.expiresAt - deliveryStarted);
    await db.runTransaction(async (transaction) => {
      const current = await readStorytimeExportAuthority(transaction, userId, input.privacyRequestId);
      if (current.identityHash !== input.authorityHash || input.expiresAt <= Date.now() || performance.now() >= monotonicDeadline) {
        throw new HttpsError("failed-precondition", "Storytime export authority changed before delivery.");
      }
      downloadAudit(transaction, userId, input.privacyRequestId, "export_download_authorized", current.identityHash, input.expiresAt);
    });
    response.set({ "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="storytime-export.json"' });
    const stream = bucket.file(authority.path, { generation: objectVersion.generation }).createReadStream();
    const guarded = Readable.from((async function* () {
      let emittedBytes = 0;
      try {
        for await (const raw of stream) {
          const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
          for (let offset = 0; offset < chunk.length; offset += 64 * 1024) {
            const part = chunk.subarray(offset, offset + 64 * 1024);
            const active = await auth.verifyIdToken(bearer, true);
            requireVerifiedOwner({ auth: { uid: active.uid, token: active } });
            if (active.uid !== userId) throw new HttpsError("permission-denied", "The active export account changed.");
            const current = await db.runTransaction((transaction) => readStorytimeExportAuthority(transaction, userId, input.privacyRequestId));
            if (current.identityHash !== input.authorityHash || input.expiresAt <= Date.now()
              || performance.now() >= monotonicDeadline || emittedBytes + part.length > objectVersion.bytes) {
              throw new HttpsError("failed-precondition", "Storytime export authority changed during delivery.");
            }
            emittedBytes += part.length;
            yield part;
          }
        }
        if (emittedBytes !== objectVersion.bytes) throw new Error("Storytime export object length changed during delivery.");
      } finally { stream.destroy(); }
    })());
    response.once("close", () => { if (!response.writableFinished) guarded.destroy(); });
    await pipeline(guarded, response);
  } catch (error) {
    if (response.headersSent || response.destroyed) return;
    const status = error instanceof HttpsError
      ? ({ unauthenticated: 401, "permission-denied": 403, "not-found": 404, "invalid-argument": 400, "failed-precondition": 409 } as Record<string, number>)[error.code] ?? 500
      : error instanceof z.ZodError ? 400 : 500;
    response.status(status).json({ error: "storytime_export_download_unavailable" });
  }
});

export const revokeStorytimeExportRequest = onCall(async (request) => {
  const userId = requireVerifiedOwner(request);
  const input = ExportRequestSchema.parse(request.data);
  await db.runTransaction(async (transaction) => {
    const privacyRequest = await readOwnedPrivacyRequest(input.privacyRequestId, userId, "export", transaction);
    transaction.update(privacyRequest.ref, { status: "cancelled", executionState: "revoked", revokedAt: nowIso(), updatedAt: nowIso() });
  });
  return { privacyRequestId: input.privacyRequestId, status: "cancelled" };
});

export const planStorytimeDeletion = onCall(async (request) => {
  const userId = requireVerifiedOwner(request);
  const input = DeletionPlanRequestSchema.parse(request.data);
  const privacyRequest = await readOwnedPrivacyRequest(input.privacyRequestId, userId, "deletion");
  const plan = await buildDeletionPlan(input.privacyRequestId, privacyRequest.data);
  const planHash = deletionPlanHash(plan);
  const planId = `${input.privacyRequestId}_${planHash}`;

  await db.collection("privacyDeletionPlans").doc(planId).set({
    plan,
    planHash,
    userId,
    privacyRequestId: input.privacyRequestId,
    createdAt: plan.generatedAt
  }, { merge: false });

  await privacyRequest.ref.update({
    status: "processing",
    executionState: plan.executionBlockers.length === 0 ? "plan_ready" : "blocked",
    deletionPlanId: planId,
    deletionPlanHash: planHash,
    deletionPlanCounts: Object.fromEntries(Object.entries(plan.targets).map(([name, ids]) => [name, ids.length])),
    deletionExecutionBlockers: plan.executionBlockers,
    deletionCompletionBlockers: plan.completionBlockers,
    updatedAt: plan.generatedAt
  });

  auditLog({
    event: "privacy_deletion_planned",
    userId,
    errorCode: plan.executionBlockers.length === 0 ? "ready" : "blocked"
  });

  return {
    privacyRequestId: input.privacyRequestId,
    planHash,
    counts: Object.fromEntries(Object.entries(plan.targets).map(([name, ids]) => [name, ids.length])),
    storageObjectCount: plan.storageObjects.length,
    executionBlockers: plan.executionBlockers,
    completionBlockers: plan.completionBlockers,
    readyForAdminExecution: plan.executionBlockers.length === 0
  };
});

export const executeStorytimeDeletion = onCall(async (request) => {
  const adminUid = requireAdmin(request);
  const input = DeletionExecuteSchema.parse(request.data);
  const privacyRequest = await readPrivacyRequest(input.privacyRequestId);
  if (privacyRequest.data.type !== "deletion") {
    throw new HttpsError("failed-precondition", "Privacy request is not a deletion request.");
  }

  const planId = String(privacyRequest.data.deletionPlanId ?? "");
  const storedPlanHash = String(privacyRequest.data.deletionPlanHash ?? "");
  if (!planId || !storedPlanHash || storedPlanHash !== input.expectedPlanHash) {
    throw new HttpsError("failed-precondition", "A current approved deletion plan hash is required.");
  }

  const planSnapshot = await db.collection("privacyDeletionPlans").doc(planId).get();
  if (!planSnapshot.exists) throw new HttpsError("failed-precondition", "Stored Storytime deletion plan is missing.");
  const storedPlan = planSnapshot.data()?.plan as DeletionPlan | undefined;
  if (!storedPlan || deletionPlanHash(storedPlan) !== input.expectedPlanHash) {
    throw new HttpsError("failed-precondition", "Stored Storytime deletion plan failed integrity verification.");
  }

  const currentPlan = await buildDeletionPlan(input.privacyRequestId, privacyRequest.data);
  const currentHash = deletionPlanHash(currentPlan);
  if (currentHash !== input.expectedPlanHash) {
    throw new HttpsError("failed-precondition", "Storytime deletion targets changed. Run a new deletion plan before execution.");
  }
  if (currentPlan.executionBlockers.length > 0) {
    auditLog({ event: "privacy_deletion_blocked", userId: currentPlan.userId, errorCode: currentPlan.executionBlockers.join("|").slice(0, 180) });
    throw new HttpsError("failed-precondition", "Storytime deletion is blocked by unresolved privacy/runtime prerequisites.");
  }

  await privacyRequest.ref.update({
    status: "processing",
    executionState: "executing",
    destructiveExecutionStartedAt: nowIso(),
    destructiveExecutionStartedBy: adminUid,
    updatedAt: nowIso()
  });

  try {
    const deletedCounts = await deleteTargets(currentPlan);
    const receiptId = await writeReceipt({
      userId: currentPlan.userId,
      privacyRequestId: input.privacyRequestId,
      type: "deletion_mutation",
      metadata: {
        planHash: input.expectedPlanHash,
        deletedCounts,
        completionBlockers: currentPlan.completionBlockers
      }
    });

    await privacyRequest.ref.update({
      status: "processing",
      executionState: "verification_required",
      primaryStoreDeletionReceiptId: receiptId,
      deletedCounts,
      primaryStoreDeletedAt: nowIso(),
      deletionCompletionVerificationRequired: true,
      deletionCompletionVerified: false,
      completionReceiptId: null,
      updatedAt: nowIso()
    });

    auditLog({ event: "privacy_deletion_executed", userId: currentPlan.userId, errorCode: "verification_required" });

    return {
      privacyRequestId: input.privacyRequestId,
      status: "processing",
      executionState: "verification_required",
      deletedCounts,
      verificationRequired: true,
      completionBlockers: currentPlan.completionBlockers
    };
  } catch (error) {
    await privacyRequest.ref.update({
      status: "processing",
      executionState: "retry_required",
      deletionCompletionVerified: false,
      completionReceiptId: null,
      deletionFailureCode: error instanceof Error ? error.name : "unknown",
      updatedAt: nowIso()
    });
    auditLog({ event: "privacy_deletion_blocked", userId: currentPlan.userId, errorCode: "retry_required" });
    throw new HttpsError("internal", "Storytime deletion did not complete. The request remains open for governed recovery.");
  }
});

export const verifyStorytimeDeletion = onCall(async (request) => {
  const adminUid = requireAdmin(request);
  const input = DeletionPlanRequestSchema.parse(request.data);
  const privacyRequest = await readPrivacyRequest(input.privacyRequestId);
  if (privacyRequest.data.type !== "deletion") {
    throw new HttpsError("failed-precondition", "Privacy request is not a deletion request.");
  }
  if (!["verification_required", "backup_expiry_pending"].includes(String(privacyRequest.data.executionState ?? ""))) {
    throw new HttpsError("failed-precondition", "Storytime deletion is not ready for completion verification.");
  }

  const planId = privacyRequest.data.deletionPlanId;
  const planHash = privacyRequest.data.deletionPlanHash;
  if (!planId || !planHash) {
    throw new HttpsError("failed-precondition", "The executed deletion plan is required for verification.");
  }
  const storedPlanSnapshot = await db.collection("privacyDeletionPlans").doc(planId).get();
  const storedPlan = storedPlanSnapshot.data()?.plan as DeletionPlan | undefined;
  if (!storedPlan || deletionPlanHash(storedPlan) !== planHash
    || storedPlan.privacyRequestId !== input.privacyRequestId
    || storedPlan.userId !== privacyRequest.data.userId
    || storedPlan.scope !== privacyRequest.data.scope
    || storedPlan.sessionId !== (privacyRequest.data.sessionId ?? null)) {
    throw new HttpsError("failed-precondition", "The executed deletion plan failed verification authority checks.");
  }

  // Only this admin-only verifier may collect children after the parent was deleted.
  const verificationPlan = await buildDeletionPlan(input.privacyRequestId, privacyRequest.data, true);
  const remaining = remainingDeletionTargets(verificationPlan);
  // Some original targets (for example moderation and public shares) depend on
  // deleted parent metadata. Read the exact executed target set as well.
  for (const [collectionName, ids] of Object.entries(storedPlan.targets)) {
    for (let offset = 0; offset < ids.length; offset += QUERY_PAGE_LIMIT) {
      const references = ids.slice(offset, offset + QUERY_PAGE_LIMIT)
        .map((id) => db.collection(collectionName).doc(id));
      if (references.length === 0) continue;
      const snapshots = await db.getAll(...references);
      remaining.push(...snapshots.filter((snapshot) => snapshot.exists)
        .map((snapshot) => `${collectionName}/${snapshot.id}:still_exists`));
    }
  }
  if (verificationPlan.storageObjects.length > 0) remaining.push(`storageObjects:${verificationPlan.storageObjects.length}`);
  if (verificationPlan.executionBlockers.length > 0) remaining.push(...verificationPlan.executionBlockers);

  if (privacyRequest.data.scope === "account") {
    try {
      await auth.getUser(privacyRequest.data.userId);
      remaining.push("auth_user_still_exists");
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      if (code !== "auth/user-not-found") throw error;
    }
  }

  if (remaining.length > 0) {
    await privacyRequest.ref.update({
      status: "processing",
      executionState: "verification_failed",
      deletionCompletionVerified: false,
      deletionVerificationBlockers: remaining,
      updatedAt: nowIso()
    });
    auditLog({ event: "privacy_deletion_blocked", userId: privacyRequest.data.userId, errorCode: "verification_failed" });
    return {
      privacyRequestId: input.privacyRequestId,
      completed: false,
      executionState: "verification_failed",
      blockers: remaining
    };
  }

  if (process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY !== "true") {
    await privacyRequest.ref.update({
      status: "processing",
      executionState: "backup_expiry_pending",
      deletionCompletionVerified: true,
      deletionVerificationBlockers: [],
      updatedAt: nowIso()
    });
    return {
      privacyRequestId: input.privacyRequestId,
      completed: false,
      executionState: "backup_expiry_pending",
      blockers: ["backup_expiry_policy_not_certified"]
    };
  }

  const receiptId = await writeReceipt({
    userId: privacyRequest.data.userId,
    privacyRequestId: input.privacyRequestId,
    type: "deletion_completed",
    metadata: {
      verifiedBy: adminUid,
      planHash: privacyRequest.data.deletionPlanHash ?? null,
      backupRetentionPolicyReady: true
    }
  });

  await privacyRequest.ref.update({
    status: "completed",
    executionState: "completed",
    deletionCompletionVerified: true,
    deletionCompletedAt: nowIso(),
    deletionVerificationBlockers: [],
    completionReceiptId: receiptId,
    updatedAt: nowIso()
  });

  auditLog({ event: "privacy_deletion_verified", userId: privacyRequest.data.userId, errorCode: "completed" });

  return {
    privacyRequestId: input.privacyRequestId,
    completed: true,
    executionState: "completed",
    completionReceiptId: receiptId
  };
});


