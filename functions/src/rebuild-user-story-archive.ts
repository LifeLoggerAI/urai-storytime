import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { buildArchiveRebuildEventRecord } from "./storytime-scroll-builders.js";

if (!getApps().length) initializeApp();

const db = getFirestore();
const MAX_ARCHIVE_SESSIONS = 200;
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const rebuildUserStoryArchive = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError("unauthenticated", "Sign in is required.");

  const sessions = await db.collection("storySessions")
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc")
    .limit(MAX_ARCHIVE_SESSIONS)
    .get();

  const createdAt = now();
  const sessionIds = sessions.docs.map((doc) => doc.id);
  const archiveSnapshotId = id("storyArchiveSnapshot");
  const timelineEventId = id("timelineReplayEvent");

  const snapshot = {
    schemaVersion: "storytime-archive-snapshot-v1",
    id: archiveSnapshotId,
    userId,
    sessionIds,
    sessionCount: sessionIds.length,
    truncatedAt: sessions.size >= MAX_ARCHIVE_SESSIONS ? MAX_ARCHIVE_SESSIONS : null,
    createdAt,
    updatedAt: createdAt
  };

  const event = buildArchiveRebuildEventRecord({
    id: timelineEventId,
    userId,
    sessionIds,
    createdAt
  });

  const batch = db.batch();
  batch.set(db.collection("storyArchiveSnapshots").doc(archiveSnapshotId), snapshot);
  batch.set(db.collection("timelineReplayEvents").doc(timelineEventId), {
    ...event,
    label: "Story archive snapshot rebuilt",
    metadata: {
      ...event.metadata,
      archiveSnapshotId,
      boundedAt: MAX_ARCHIVE_SESSIONS
    }
  });
  await batch.commit();

  return {
    status: "completed",
    archiveSnapshotId,
    timelineEventId,
    sessionCount: sessionIds.length,
    truncated: sessions.size >= MAX_ARCHIVE_SESSIONS
  };
});
