import { createHash } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldPath,
  Timestamp,
  getFirestore,
  type DocumentData,
  type QueryDocumentSnapshot
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket();
const auth = getAuth();

const QUERY_PAGE_LIMIT = 400;
const DELETE_BATCH_LIMIT = 400;
const EXPORT_SIGNED_URL_TTL_MS = 15 * 60 * 1000;
const STORYTIME_PRIVACY_POLICY_VERSION = "urai-privacy-0.2.0-staging-scaffold";
const STORYTIME_EXPORT_SCHEMA_VERSION = "storytime-export-v1";
const STORYTIME_DELETION_PLAN_SCHEMA_VERSION = "storytime-deletion-plan-v1";
const STORYTIME_PRIVACY_RECEIPT_SCHEMA_VERSION = "storytime-privacy-operation-receipt-v1";

const ExportRequestSchema = z.object({
  privacyRequestId: z.string().min(1).max(300)
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

const accountUserCollections = [
  "storySessions",
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
  "publicStoryShareControls"
] as const;

const accountOwnerCollections = [
  "finiteTimeCanonRegistries",
  "finiteTimeCanonRegistryRevisions",
  "finiteTimeShotGraphs"
] as const;

const sessionScalarCollections = [
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
  "publicStoryShareControls"
] as const;

const sessionArrayCollections = [
  "weeklyStoryScrolls",
  "monthlyStoryScrolls",
  "storyArchiveSnapshots"
] as const;

type PrivacyScope = "account" | "story_session";

type StoredPrivacyRequest = {
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
  exportBlockers?: string[];
  exportManifestSha256?: string | null;
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

async function listByField(collectionName: string, field: string | FieldPath, value: unknown) {
  const rows: Array<{ id: string; data: DocumentData }> = [];
  let cursor: QueryDocumentSnapshot | undefined;

  while (true) {
    let query = db.collection(collectionName)
      .where(field, "==", value)
      .orderBy(FieldPath.documentId())
      .limit(QUERY_PAGE_LIMIT);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    rows.push(...snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })));
    if (snapshot.size < QUERY_PAGE_LIMIT) break;
    cursor = snapshot.docs.at(-1);
    if (!cursor) break;
  }

  return rows;
}

async function listByArrayContains(collectionName: string, field: string, value: string) {
  const rows: Array<{ id: string; data: DocumentData }> = [];
  let cursor: QueryDocumentSnapshot | undefined;

  while (true) {
    let query = db.collection(collectionName)
      .where(field, "array-contains", value)
      .orderBy(FieldPath.documentId())
      .limit(QUERY_PAGE_LIMIT);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    rows.push(...snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() })));
    if (snapshot.size < QUERY_PAGE_LIMIT) break;
    cursor = snapshot.docs.at(-1);
    if (!cursor) break;
  }

  return rows;
}

async function readPrivacyRequest(privacyRequestId: string) {
  const ref = db.collection("privacyRequests").doc(privacyRequestId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Storytime privacy request was not found.");
  return { ref, data: snapshot.data() as StoredPrivacyRequest };
}

async function readOwnedPrivacyRequest(privacyRequestId: string, userId: string, type: "export" | "deletion") {
  const request = await readPrivacyRequest(privacyRequestId);
  if (request.data.userId !== userId || request.data.type !== type) {
    throw new HttpsError("permission-denied", "Storytime privacy request is unavailable.");
  }
  return request;
}

async function assertOwnedSession(sessionId: string, userId: string) {
  const snapshot = await db.collection("storySessions").doc(sessionId).get();
  if (!snapshot.exists || snapshot.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "You do not own that Storytime session.");
  }
  return { id: snapshot.id, data: snapshot.data() ?? {} };
}

async function familyMemberships(userId: string) {
  const rolePath = new FieldPath("members", userId, "role");
  const snapshot = await db.collection("families")
    .where(rolePath, "in", ["owner", "guardian", "viewer"])
    .limit(100)
    .get();
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

  const byUid = await db.collection("legalHoldRecords")
    .where("uid", "==", userId)
    .where("status", "==", "active")
    .limit(1)
    .get();
  if (!byUid.empty) return true;

  const byUserId = await db.collection("legalHoldRecords")
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .limit(1)
    .get();
  return !byUserId.empty;
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

async function collectAccountRows(userId: string) {
  const collections: Record<string, Array<{ id: string; data: DocumentData }>> = {};

  const user = await db.collection("users").doc(userId).get();
  collections.users = user.exists ? [{ id: user.id, data: user.data() ?? {} }] : [];

  for (const name of accountUserCollections) {
    collections[name] = await listByField(name, "userId", userId);
  }
  for (const name of accountOwnerCollections) {
    collections[name] = await listByField(name, "ownerId", userId);
  }
  collections.privacyRequests = await listByField("privacyRequests", "userId", userId);

  const publicShareIds = collections.publicStoryShareControls.map((row) => row.id);
  const publicShares: Array<{ id: string; data: DocumentData }> = [];
  for (const shareId of publicShareIds) {
    const snapshot = await db.collection("publicStoryShares").doc(shareId).get();
    if (snapshot.exists) publicShares.push({ id: snapshot.id, data: snapshot.data() ?? {} });
  }
  collections.publicStoryShares = publicShares;

  return collections;
}

async function collectSessionRows(userId: string, sessionId: string) {
  const session = await assertOwnedSession(sessionId, userId);
  const collections: Record<string, Array<{ id: string; data: DocumentData }>> = {
    storySessions: [{ id: session.id, data: session.data }]
  };

  for (const name of sessionScalarCollections) {
    const rows = await listByField(name, "sessionId", sessionId);
    collections[name] = rows.filter((row) => row.data.userId === undefined || row.data.userId === userId);
  }
  for (const name of sessionArrayCollections) {
    const rows = await listByArrayContains(name, "sessionIds", sessionId);
    collections[name] = rows.filter((row) => row.data.userId === undefined || row.data.userId === userId);
  }

  const requestId = typeof session.data.requestId === "string" ? session.data.requestId : null;
  collections.moderation = requestId ? await listByField("moderation", "requestId", requestId) : [];

  const publicShareIds = (collections.publicStoryShareControls ?? []).map((row) => row.id);
  const publicShares: Array<{ id: string; data: DocumentData }> = [];
  for (const shareId of publicShareIds) {
    const snapshot = await db.collection("publicStoryShares").doc(shareId).get();
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
    metadata: args.metadata,
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

async function buildDeletionPlan(privacyRequestId: string, request: StoredPrivacyRequest): Promise<DeletionPlan> {
  const userId = request.userId;
  const scope = request.scope;
  const sessionId = request.sessionId ?? null;
  const collections = scope === "account"
    ? await collectAccountRows(userId)
    : await collectSessionRows(userId, String(sessionId));

  const retainedData = [
    "privacyRequests",
    "privacyDeletionPlans",
    "privacyOperationReceipts",
    "legalHoldRecords"
  ];

  const targets: Record<string, string[]> = {};
  const executionBlockers: string[] = [];
  for (const [name, rows] of Object.entries(collections)) {
    if (retainedData.includes(name)) continue;

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

  if (
    privacyRequest.data.executionState === "completed"
    && privacyRequest.data.exportPath
    && privacyRequest.data.exportManifestPath
    && privacyRequest.data.exportPackageSha256
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
  const collections = scope === "account"
    ? await collectAccountRows(userId)
    : await collectSessionRows(userId, String(sessionId));
  const family = scope === "account" ? await familyMemberships(userId) : { memberships: [], truncated: false };
  const externalBlockers = externalArtifactPointers(flattenExternalRows(collections));
  const blockers = [
    ...(family.memberships.length > 0 ? ["family_or_child_data_requires_urai_privacy_review"] : []),
    ...(family.truncated ? ["family_membership_scan_truncated"] : []),
    ...externalBlockers
  ];

  const generatedAt = nowIso();
  const authAccount = scope === "account" ? await authAccountMetadata(userId) : null;
  const exportPackage = {
    schemaVersion: STORYTIME_EXPORT_SCHEMA_VERSION,
    policyVersion: STORYTIME_PRIVACY_POLICY_VERSION,
    sourceRepo: "LifeLoggerAI/urai-storytime",
    privacyRequestId: input.privacyRequestId,
    userId,
    scope,
    sessionId,
    generatedAt,
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
      exportPath: exportFile.path,
      manifestPath: manifestFile.path,
      completeness: manifest.completeness,
      blockers
    }
  });

  await privacyRequest.ref.update({
    status: blockers.length === 0 ? "completed" : "processing",
    executionState: blockers.length === 0 ? "completed" : "review_required",
    exportPath: exportFile.path,
    exportManifestPath: manifestFile.path,
    exportPackageSha256: packageDigest,
    exportManifestSha256: manifestFile.sha256,
    exportCompleteness: manifest.completeness,
    exportBlockers: blockers,
    completionReceiptId: blockers.length === 0 ? receiptId : null,
    updatedAt: generatedAt
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

export const getStorytimeExportDownloadUrl = onCall(async (request) => {
  const userId = requireVerifiedOwner(request);
  const input = ExportRequestSchema.parse(request.data);
  const privacyRequest = await readOwnedPrivacyRequest(input.privacyRequestId, userId, "export");
  const path = String(privacyRequest.data.exportPath ?? "");
  if (!path) throw new HttpsError("failed-precondition", "Storytime export package is not ready.");
  if (privacyRequest.data.exportCompleteness !== "complete_for_storytime_owned_data") {
    throw new HttpsError("failed-precondition", "Storytime export requires privacy review before download can be authorized.");
  }

  const expiresAt = Date.now() + EXPORT_SIGNED_URL_TTL_MS;
  const [url] = await bucket.file(path).getSignedUrl({ action: "read", expires: expiresAt });
  await privacyRequest.ref.update({
    lastExportDownloadUrlCreatedAt: nowIso(),
    lastExportDownloadUrlExpiresAt: new Date(expiresAt).toISOString()
  });
  auditLog({ event: "privacy_export_download_url_created", userId });

  return {
    privacyRequestId: input.privacyRequestId,
    url,
    expiresAt: new Date(expiresAt).toISOString(),
    completeness: privacyRequest.data.exportCompleteness ?? "unknown",
    packageSha256: privacyRequest.data.exportPackageSha256 ?? null
  };
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

  const verificationPlan = await buildDeletionPlan(input.privacyRequestId, privacyRequest.data);
  const remaining = remainingDeletionTargets(verificationPlan);
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
