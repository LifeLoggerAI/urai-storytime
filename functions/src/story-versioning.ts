import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type DocumentData, type DocumentSnapshot } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const MAX_VERSION_HISTORY = 25;

const SaveRevisionSchema = z.object({
  sessionId: z.string().min(1).max(256),
  expectedCurrentVersionId: z.string().min(1).max(256),
  editReason: z.string().min(1).max(240).default("User correction"),
  title: z.string().min(1).max(120).optional(),
  chapterEdits: z.array(z.object({
    chapterId: z.string().min(1).max(256),
    summary: z.string().max(800)
  })).max(20).default([]),
  momentEdits: z.array(z.object({
    momentId: z.string().min(1).max(256),
    title: z.string().min(1).max(140).optional(),
    body: z.string().max(1600).optional()
  })).max(50).default([]),
  narratorEdits: z.array(z.object({
    narratorScriptId: z.string().min(1).max(256),
    text: z.string().max(1200)
  })).max(20).default([])
}).superRefine((value, ctx) => {
  if (
    value.title === undefined
    && value.chapterEdits.length === 0
    && value.momentEdits.length === 0
    && value.narratorEdits.length === 0
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

const blockedEditPatterns = [
  /\b(?:suicide|self[- ]?harm|kill myself|kill yourself)\b/i,
  /\b(?:explicit sexual|sexual content|porn|rape)\b/i,
  /(?:ignore (?:all|previous|prior) instructions|reveal .*system prompt|bypass .*safety)/i
];

type VersionSnapshot = {
  title: string;
  chapters: Array<{ id: string; order: number; title: string; summary: string }>;
  moments: Array<{ id: string; chapterId: string; order: number; title: string; body: string }>;
  narratorScripts: Array<{ id: string; chapterId?: string; text: string }>;
};

function now() {
  return new Date().toISOString();
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
  if (blockedEditPatterns.some((pattern) => pattern.test(combined))) {
    throw new HttpsError("failed-precondition", "This edit requires safety review before it can replace the active story text.");
  }
}

async function readOwnedSession(sessionId: string, userId: string) {
  const ref = db.collection("storySessions").doc(sessionId);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Story session was not found.");
  }
  return { ref, snapshot, data: snapshot.data() ?? {} };
}

async function queryOwned(collectionName: string, sessionId: string, userId: string) {
  const snapshot = await db.collection(collectionName).where("sessionId", "==", sessionId).get();
  return snapshot.docs.filter((doc) => doc.data()?.userId === userId);
}

function byOrder(left: DocumentSnapshot, right: DocumentSnapshot) {
  return Number(left.data()?.order ?? 0) - Number(right.data()?.order ?? 0);
}

function snapshotFromDocs(
  session: DocumentData,
  chapters: DocumentSnapshot[],
  moments: DocumentSnapshot[],
  scripts: DocumentSnapshot[]
): VersionSnapshot {
  return {
    title: String(session.title ?? "Untitled Story"),
    chapters: [...chapters].sort(byOrder).map((doc) => ({
      id: doc.id,
      order: Number(doc.data()?.order ?? 0),
      title: String(doc.data()?.title ?? ""),
      summary: String(doc.data()?.summary ?? "")
    })),
    moments: [...moments].sort(byOrder).map((doc) => ({
      id: doc.id,
      chapterId: String(doc.data()?.chapterId ?? ""),
      order: Number(doc.data()?.order ?? 0),
      title: String(doc.data()?.title ?? ""),
      body: String(doc.data()?.body ?? "")
    })),
    narratorScripts: scripts.map((doc) => ({
      id: doc.id,
      chapterId: typeof doc.data()?.chapterId === "string" ? doc.data()?.chapterId : undefined,
      text: String(doc.data()?.text ?? "")
    }))
  };
}

function applyEdits(
  snapshot: VersionSnapshot,
  input: z.infer<typeof SaveRevisionSchema>
): VersionSnapshot {
  const chapterMap = new Map(input.chapterEdits.map((edit) => [edit.chapterId, edit]));
  const momentMap = new Map(input.momentEdits.map((edit) => [edit.momentId, edit]));
  const narratorMap = new Map(input.narratorEdits.map((edit) => [edit.narratorScriptId, edit]));

  return {
    title: input.title ?? snapshot.title,
    chapters: snapshot.chapters.map((chapter) => ({
      ...chapter,
      summary: chapterMap.get(chapter.id)?.summary ?? chapter.summary
    })),
    moments: snapshot.moments.map((moment) => {
      const edit = momentMap.get(moment.id);
      return {
        ...moment,
        title: edit?.title ?? moment.title,
        body: edit?.body ?? moment.body
      };
    }),
    narratorScripts: snapshot.narratorScripts.map((script) => ({
      ...script,
      text: narratorMap.get(script.id)?.text ?? script.text
    }))
  };
}

function assertEditIdsExist(
  snapshot: VersionSnapshot,
  input: z.infer<typeof SaveRevisionSchema>
) {
  const chapterIds = new Set(snapshot.chapters.map((item) => item.id));
  const momentIds = new Set(snapshot.moments.map((item) => item.id));
  const scriptIds = new Set(snapshot.narratorScripts.map((item) => item.id));

  if (input.chapterEdits.some((edit) => !chapterIds.has(edit.chapterId))) {
    throw new HttpsError("invalid-argument", "A chapter edit does not belong to this story.");
  }
  if (input.momentEdits.some((edit) => !momentIds.has(edit.momentId))) {
    throw new HttpsError("invalid-argument", "A moment edit does not belong to this story.");
  }
  if (input.narratorEdits.some((edit) => !scriptIds.has(edit.narratorScriptId))) {
    throw new HttpsError("invalid-argument", "A narrator edit does not belong to this story.");
  }
}

function versionSafetyText(snapshot: VersionSnapshot) {
  return [
    snapshot.title,
    ...snapshot.chapters.flatMap((item) => [item.title, item.summary]),
    ...snapshot.moments.flatMap((item) => [item.title, item.body]),
    ...snapshot.narratorScripts.map((item) => item.text)
  ];
}

function versionRecord(args: {
  id: string;
  userId: string;
  sessionId: string;
  versionNumber: number;
  parentVersionId: string;
  snapshot: VersionSnapshot;
  reason: "user_edit" | "restore";
  editReason: string;
  restoredFromVersionId?: string;
  sourceProvenance?: unknown;
}) {
  const createdAt = now();
  return {
    schemaVersion: "storytime-version-v1",
    id: args.id,
    userId: args.userId,
    sessionId: args.sessionId,
    versionNumber: args.versionNumber,
    parentVersionId: args.parentVersionId,
    restoredFromVersionId: args.restoredFromVersionId ?? null,
    reason: args.reason,
    editReason: args.editReason,
    snapshot: args.snapshot,
    provenance: {
      sourceStoryProvenance: args.sourceProvenance ?? null,
      userEdited: true,
      providerCallMade: false,
      providerSpendAuthorized: false
    },
    safetyStatus: "approved",
    immutable: true,
    createdAt
  };
}

async function loadEditableBundle(sessionId: string, userId: string) {
  const session = await readOwnedSession(sessionId, userId);
  const [chapters, moments, scripts] = await Promise.all([
    queryOwned("storyChapters", sessionId, userId),
    queryOwned("storyMoments", sessionId, userId),
    queryOwned("narratorScripts", sessionId, userId)
  ]);
  return {
    session,
    chapters,
    moments,
    scripts,
    snapshot: snapshotFromDocs(session.data, chapters, moments, scripts)
  };
}

function requireVersionedSession(session: DocumentData, expectedCurrentVersionId: string) {
  if (typeof session.currentVersionId !== "string" || typeof session.currentVersionNumber !== "number") {
    throw new HttpsError("failed-precondition", "This older Storytime session needs a version-history baseline before editing.");
  }
  if (session.currentVersionId !== expectedCurrentVersionId) {
    throw new HttpsError("aborted", "This story changed since you opened it. Reload before saving another edit.");
  }
  return {
    currentVersionId: session.currentVersionId as string,
    currentVersionNumber: session.currentVersionNumber as number
  };
}

export const saveStoryRevision = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  const parsed = SaveRevisionSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Provide a valid bounded Storytime edit.");
  const input = parsed.data;

  const bundle = await loadEditableBundle(input.sessionId, userId);
  const current = requireVersionedSession(bundle.session.data, input.expectedCurrentVersionId);
  assertEditIdsExist(bundle.snapshot, input);

  const nextSnapshot = applyEdits(bundle.snapshot, input);
  assertSafeEditText(versionSafetyText(nextSnapshot));

  const versionRef = db.collection("storyVersions").doc();
  const nextVersionNumber = current.currentVersionNumber + 1;
  const version = versionRecord({
    id: versionRef.id,
    userId,
    sessionId: input.sessionId,
    versionNumber: nextVersionNumber,
    parentVersionId: current.currentVersionId,
    snapshot: nextSnapshot,
    reason: "user_edit",
    editReason: input.editReason,
    sourceProvenance: bundle.session.data.provenance
  });

  const batch = db.batch();
  if (input.title !== undefined) {
    batch.update(bundle.session.ref, { title: input.title, updatedAt: version.createdAt });
  }
  for (const edit of input.chapterEdits) {
    const doc = bundle.chapters.find((item) => item.id === edit.chapterId)!;
    batch.update(doc.ref, { summary: edit.summary, updatedAt: version.createdAt });
  }
  for (const edit of input.momentEdits) {
    const doc = bundle.moments.find((item) => item.id === edit.momentId)!;
    const patch: Record<string, unknown> = { updatedAt: version.createdAt };
    if (edit.title !== undefined) patch.title = edit.title;
    if (edit.body !== undefined) patch.body = edit.body;
    batch.update(doc.ref, patch);
  }
  for (const edit of input.narratorEdits) {
    const doc = bundle.scripts.find((item) => item.id === edit.narratorScriptId)!;
    batch.update(doc.ref, { text: edit.text, updatedAt: version.createdAt });
  }
  batch.set(versionRef, version);
  batch.update(bundle.session.ref, {
    currentVersionId: versionRef.id,
    currentVersionNumber: nextVersionNumber,
    "provenance.edited": true,
    updatedAt: version.createdAt
  });
  await batch.commit();

  auditLog({ event: "story_revision_saved", userId, sessionId: input.sessionId });
  return {
    status: "completed",
    versionId: versionRef.id,
    versionNumber: nextVersionNumber
  };
});

export const restoreStoryVersion = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  const parsed = RestoreRevisionSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Provide a valid Storytime restore request.");
  const input = parsed.data;

  const bundle = await loadEditableBundle(input.sessionId, userId);
  const current = requireVersionedSession(bundle.session.data, input.expectedCurrentVersionId);

  const target = await db.collection("storyVersions").doc(input.targetVersionId).get();
  if (!target.exists || target.data()?.userId !== userId || target.data()?.sessionId !== input.sessionId) {
    throw new HttpsError("permission-denied", "Story version was not found.");
  }
  const targetSnapshot = target.data()?.snapshot as VersionSnapshot | undefined;
  if (!targetSnapshot) throw new HttpsError("failed-precondition", "Story version snapshot is unavailable.");
  assertSafeEditText(versionSafetyText(targetSnapshot));

  const chapterDocs = new Map(bundle.chapters.map((doc) => [doc.id, doc]));
  const momentDocs = new Map(bundle.moments.map((doc) => [doc.id, doc]));
  const scriptDocs = new Map(bundle.scripts.map((doc) => [doc.id, doc]));

  if (
    targetSnapshot.chapters.some((item) => !chapterDocs.has(item.id))
    || targetSnapshot.moments.some((item) => !momentDocs.has(item.id))
    || targetSnapshot.narratorScripts.some((item) => !scriptDocs.has(item.id))
  ) {
    throw new HttpsError("failed-precondition", "Story structure changed and this version cannot be restored safely.");
  }

  const versionRef = db.collection("storyVersions").doc();
  const nextVersionNumber = current.currentVersionNumber + 1;
  const restored = versionRecord({
    id: versionRef.id,
    userId,
    sessionId: input.sessionId,
    versionNumber: nextVersionNumber,
    parentVersionId: current.currentVersionId,
    snapshot: targetSnapshot,
    reason: "restore",
    editReason: `Restored version ${target.data()?.versionNumber ?? input.targetVersionId}`,
    restoredFromVersionId: input.targetVersionId,
    sourceProvenance: bundle.session.data.provenance
  });

  const batch = db.batch();
  batch.update(bundle.session.ref, {
    title: targetSnapshot.title,
    currentVersionId: versionRef.id,
    currentVersionNumber: nextVersionNumber,
    "provenance.edited": true,
    updatedAt: restored.createdAt
  });
  for (const chapter of targetSnapshot.chapters) {
    batch.update(chapterDocs.get(chapter.id)!.ref, { summary: chapter.summary, updatedAt: restored.createdAt });
  }
  for (const moment of targetSnapshot.moments) {
    batch.update(momentDocs.get(moment.id)!.ref, { title: moment.title, body: moment.body, updatedAt: restored.createdAt });
  }
  for (const script of targetSnapshot.narratorScripts) {
    batch.update(scriptDocs.get(script.id)!.ref, { text: script.text, updatedAt: restored.createdAt });
  }
  batch.set(versionRef, restored);
  await batch.commit();

  auditLog({ event: "story_version_restored", userId, sessionId: input.sessionId });
  return {
    status: "completed",
    versionId: versionRef.id,
    versionNumber: nextVersionNumber,
    restoredFromVersionId: input.targetVersionId
  };
});

export const listStoryVersions = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  const parsed = ListVersionsSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Provide a valid Storytime session id.");
  const input = parsed.data;
  await readOwnedSession(input.sessionId, userId);

  const snapshot = await db.collection("storyVersions").where("sessionId", "==", input.sessionId).get();
  const versions = snapshot.docs
    .filter((doc) => doc.data()?.userId === userId)
    .map((doc) => ({
      id: doc.id,
      versionNumber: Number(doc.data()?.versionNumber ?? 0),
      reason: String(doc.data()?.reason ?? "unknown"),
      editReason: String(doc.data()?.editReason ?? ""),
      restoredFromVersionId: doc.data()?.restoredFromVersionId ?? null,
      createdAt: String(doc.data()?.createdAt ?? "")
    }))
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .slice(0, MAX_VERSION_HISTORY);

  return { status: "ready", versions };
});
