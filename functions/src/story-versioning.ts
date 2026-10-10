import { createHash } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Transaction } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";
import { STORY_VERSION_SCHEMA_VERSION } from "./story-version.js";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const MAX_VERSION_HISTORY = 25;
// This revision path is provider-free: edits and restores never authorize generation or provider spend.

const SaveRevisionSchema = z.object({
  sessionId: z.string().min(1).max(256),
  expectedCurrentVersionId: z.string().min(1).max(256),
  editReason: z.string().min(1).max(240).default("User correction"),
  title: z.string().min(1).max(120).optional(),
  chapterSummary: z.string().max(800).optional(),
  momentTitle: z.string().min(1).max(140).optional(),
  momentBody: z.string().max(1600).optional(),
  narratorText: z.string().max(1200).optional()
}).superRefine((value, ctx) => {
  if (
    value.title === undefined &&
    value.chapterSummary === undefined &&
    value.momentTitle === undefined &&
    value.momentBody === undefined &&
    value.narratorText === undefined
  ) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one Storytime edit is required." });
  }
});

const RestoreRevisionSchema = z.object({
  sessionId: z.string().min(1).max(256),
  expectedCurrentVersionId: z.string().min(1).max(256),
  targetVersionId: z.string().min(1).max(256)
});

const ListVersionsSchema = z.object({
  sessionId: z.string().min(1).max(256)
});

type VersionSnapshot = {
  title: string;
  provider: string;
  locale: string;
  audienceAgeBand: string;
  consentVersion: string;
  reviewVersion: string;
  reviewedRequestSha256: string;
  provenance: Record<string, unknown>;
  chapter: { id: string; title: string; summary: string };
  moment: { id: string; title: string; body: string };
  narrator: { id: string; text: string };
  emotionalArc: { id: string; arcLabel: string; summary: string };
};

function now() {
  return new Date().toISOString();
}

function sha256(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function requireVerifiedUser(request: { auth?: { uid: string; token?: { email_verified?: unknown } } | null }) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (request.auth?.token?.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Verify the account email before editing a Storytime story.");
  }
  return uid;
}

function assertSafeEditText(values: string[]) {
  const combined = values.join("\n");
  const blocked = [
    /\b(?:suicide|self[- ]?harm|kill myself|kill yourself)\b/i,
    /\b(?:explicit sexual|sexual content|porn|rape)\b/i,
    /(?:ignore (?:all|previous|prior) instructions|reveal .*system prompt|bypass .*safety)/i
  ];
  if (blocked.some((pattern) => pattern.test(combined))) {
    throw new HttpsError("failed-precondition", "This edit requires safety review before it can replace the active story text.");
  }
}

async function readOwnedSession(sessionId: string, userId: string, transaction?: Transaction) {
  const ref = db.collection("storySessions").doc(sessionId);
  const snapshot = transaction ? await transaction.get(ref) : await ref.get();
  if (!snapshot.exists || snapshot.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Story session was not found.");
  }
  return { ref, data: snapshot.data() ?? {} };
}

async function readOwnedVersion(versionId: string, sessionId: string, userId: string, transaction: Transaction) {
  const ref = db.collection("storyVersions").doc(versionId);
  const snapshot = await transaction.get(ref);
  const data = snapshot.data();
  if (!snapshot.exists || data?.userId !== userId || data?.sessionId !== sessionId) {
    throw new HttpsError("permission-denied", "Story version was not found.");
  }
  if (data?.schemaVersion !== STORY_VERSION_SCHEMA_VERSION || data?.status !== "committed" || data?.immutable !== true || !data?.snapshot) {
    throw new HttpsError("failed-precondition", "Story version is not a valid immutable Storytime snapshot.");
  }
  return { ref, data, snapshot: data.snapshot as VersionSnapshot };
}

function currentAuthority(session: Record<string, unknown>, expectedCurrentVersionId: string) {
  if (typeof session.currentVersionId !== "string" || typeof session.versionNumber !== "number"
    || !Number.isSafeInteger(session.versionNumber) || session.versionNumber < 1
    || session.versionNumber >= Number.MAX_SAFE_INTEGER) {
    throw new HttpsError("failed-precondition", "This older Storytime session needs a version baseline before editing.");
  }
  if (session.currentVersionId !== expectedCurrentVersionId) {
    throw new HttpsError("aborted", "This story changed since you opened it. Reload before saving another edit.");
  }
  return { currentVersionId: session.currentVersionId, versionNumber: session.versionNumber };
}

function editedSnapshot(snapshot: VersionSnapshot, input: z.infer<typeof SaveRevisionSchema>): VersionSnapshot {
  const next: VersionSnapshot = {
    ...snapshot,
    title: input.title ?? snapshot.title,
    chapter: { ...snapshot.chapter, summary: input.chapterSummary ?? snapshot.chapter.summary },
    moment: {
      ...snapshot.moment,
      title: input.momentTitle ?? snapshot.moment.title,
      body: input.momentBody ?? snapshot.moment.body
    },
    narrator: { ...snapshot.narrator, text: input.narratorText ?? snapshot.narrator.text }
  };
  assertSafeEditText([next.title, next.chapter.title, next.chapter.summary, next.moment.title, next.moment.body, next.narrator.text]);
  return next;
}

function versionRecord(args: {
  id: string;
  userId: string;
  sessionId: string;
  versionNumber: number;
  parentVersionId: string;
  reason: "user_edit" | "restored_version";
  editReason: string;
  snapshot: VersionSnapshot;
  restoredFromVersionId?: string;
}) {
  const timestamp = now();
  return {
    schemaVersion: STORY_VERSION_SCHEMA_VERSION,
    id: args.id,
    userId: args.userId,
    sessionId: args.sessionId,
    versionNumber: args.versionNumber,
    parentVersionId: args.parentVersionId,
    reason: args.reason,
    editReason: args.editReason,
    restoredFromVersionId: args.restoredFromVersionId ?? null,
    status: "committed",
    immutable: true,
    snapshot: args.snapshot,
    contentSha256: sha256(args.snapshot),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

async function readOwnedStoryRecords(transaction: Transaction, snapshot: VersionSnapshot, sessionId: string, userId: string) {
  const references = [
    db.collection("storyChapters").doc(snapshot.chapter.id),
    db.collection("storyMoments").doc(snapshot.moment.id),
    db.collection("narratorScripts").doc(snapshot.narrator.id)
  ];
  const records = await Promise.all(references.map((ref) => transaction.get(ref)));
  if (records.some((record) => !record.exists || record.data()?.userId !== userId || record.data()?.sessionId !== sessionId)) {
    throw new HttpsError("permission-denied", "Story revision records are unavailable.");
  }
}

function assertCurrentVersionNumber(data: Record<string, unknown>, versionNumber: number) {
  if (data.versionNumber !== versionNumber) {
    throw new HttpsError("failed-precondition", "Story session and immutable version authority disagree.");
  }
}

function writeSnapshot(transaction: Transaction, snapshot: VersionSnapshot, updatedAt: string) {
  transaction.update(db.collection("storyChapters").doc(snapshot.chapter.id), {
    summary: snapshot.chapter.summary,
    updatedAt
  });
  transaction.update(db.collection("storyMoments").doc(snapshot.moment.id), {
    title: snapshot.moment.title,
    body: snapshot.moment.body,
    updatedAt
  });
  transaction.update(db.collection("narratorScripts").doc(snapshot.narrator.id), {
    text: snapshot.narrator.text,
    updatedAt
  });
}

export const saveStoryRevision = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  const parsed = SaveRevisionSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Provide a valid bounded Storytime edit.");
  const input = parsed.data;
  const versionRef = db.collection("storyVersions").doc();
  const record = await db.runTransaction(async (transaction) => {
    const session = await readOwnedSession(input.sessionId, userId, transaction);
    const authority = currentAuthority(session.data, input.expectedCurrentVersionId);
    const current = await readOwnedVersion(authority.currentVersionId, input.sessionId, userId, transaction);
    assertCurrentVersionNumber(current.data, authority.versionNumber);
    const snapshot = editedSnapshot(current.snapshot, input);
    await readOwnedStoryRecords(transaction, snapshot, input.sessionId, userId);
    const record = versionRecord({
      id: versionRef.id,
      userId,
      sessionId: input.sessionId,
      versionNumber: authority.versionNumber + 1,
      parentVersionId: authority.currentVersionId,
      reason: "user_edit",
      editReason: input.editReason,
      snapshot
    });

    writeSnapshot(transaction, snapshot, record.updatedAt);
    transaction.create(versionRef, record);
    transaction.update(session.ref, {
      title: snapshot.title,
      currentVersionId: versionRef.id,
      versionNumber: record.versionNumber,
      "provenance.edited": true,
      updatedAt: record.updatedAt
    });
    return record;
  });

  auditLog({ event: "story_revision_saved", userId, sessionId: input.sessionId });
  return { status: "completed", versionId: versionRef.id, versionNumber: record.versionNumber };
});

export const restoreStoryVersion = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  const parsed = RestoreRevisionSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Provide a valid Storytime restore request.");
  const input = parsed.data;
  const versionRef = db.collection("storyVersions").doc();
  const record = await db.runTransaction(async (transaction) => {
    const session = await readOwnedSession(input.sessionId, userId, transaction);
    const authority = currentAuthority(session.data, input.expectedCurrentVersionId);
    const current = await readOwnedVersion(authority.currentVersionId, input.sessionId, userId, transaction);
    assertCurrentVersionNumber(current.data, authority.versionNumber);
    const target = await readOwnedVersion(input.targetVersionId, input.sessionId, userId, transaction);
    assertSafeEditText([
      target.snapshot.title,
      target.snapshot.chapter.title,
      target.snapshot.chapter.summary,
      target.snapshot.moment.title,
      target.snapshot.moment.body,
      target.snapshot.narrator.text
    ]);
    await readOwnedStoryRecords(transaction, target.snapshot, input.sessionId, userId);
    const record = versionRecord({
      id: versionRef.id,
      userId,
      sessionId: input.sessionId,
      versionNumber: authority.versionNumber + 1,
      parentVersionId: authority.currentVersionId,
      reason: "restored_version",
      editReason: `Restored version ${target.data.versionNumber ?? input.targetVersionId}`,
      snapshot: target.snapshot,
      restoredFromVersionId: input.targetVersionId
    });

    writeSnapshot(transaction, target.snapshot, record.updatedAt);
    transaction.create(versionRef, record);
    transaction.update(session.ref, {
      title: target.snapshot.title,
      currentVersionId: versionRef.id,
      versionNumber: record.versionNumber,
      "provenance.edited": true,
      updatedAt: record.updatedAt
    });
    return record;
  });

  auditLog({ event: "story_version_restored", userId, sessionId: input.sessionId });
  return {
    status: "completed",
    versionId: versionRef.id,
    versionNumber: record.versionNumber,
    restoredFromVersionId: input.targetVersionId
  };
});

export const listStoryVersions = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  const parsed = ListVersionsSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Provide a valid Storytime session id.");
  await readOwnedSession(parsed.data.sessionId, userId);
  const snapshot = await db.collection("storyVersions")
    .where("sessionId", "==", parsed.data.sessionId)
    .where("userId", "==", userId)
    .orderBy("versionNumber", "desc")
    .limit(MAX_VERSION_HISTORY)
    .get();
  const versions = snapshot.docs.map((doc) => ({
    id: doc.id,
    versionNumber: Number(doc.data().versionNumber ?? 0),
    reason: String(doc.data().reason ?? "unknown"),
    editReason: String(doc.data().editReason ?? ""),
    restoredFromVersionId: doc.data().restoredFromVersionId ?? null,
    createdAt: String(doc.data().createdAt ?? "")
  })).sort((a, b) => b.versionNumber - a.versionNumber).slice(0, MAX_VERSION_HISTORY);
  return { status: "ready", versions };
});

