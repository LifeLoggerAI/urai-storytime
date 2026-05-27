import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { buildNarratorScriptRecord, buildTimelineEventRecord, type StorytimeSessionSnapshot } from "./storytime-record-builders.js";

if (!getApps().length) initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const RequestSchema = z.object({
  sessionId: z.string().min(1),
  chapterId: z.string().min(1).optional(),
  scriptType: z.string().min(1).max(80).default("memory_replay"),
  voiceTone: z.string().min(1).max(80).default("warm")
});

async function ownedSession(sessionId: string, userId: string) {
  const snap = await db.collection("storySessions").doc(sessionId).get();
  if (!snap.exists || snap.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Story not found.");
  }
  return { id: snap.id, ...snap.data() } as StorytimeSessionSnapshot;
}

export const generateNarratorScript = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError("unauthenticated", "Sign in is required.");

  const input = RequestSchema.parse(request.data);
  const session = await ownedSession(input.sessionId, userId);
  const createdAt = now();
  const narratorScriptId = id("narratorScript");
  const timelineEventId = id("timelineReplayEvent");

  const narratorScript = buildNarratorScriptRecord({
    id: narratorScriptId,
    session,
    chapterId: input.chapterId,
    scriptType: input.scriptType,
    voiceTone: input.voiceTone,
    createdAt
  });

  const timelineEvent = buildTimelineEventRecord({
    id: timelineEventId,
    userId,
    sessionId: input.sessionId,
    label: "Narrator script queued",
    action: "generateNarratorScript",
    createdAt
  });

  const batch = db.batch();
  batch.set(db.collection("narratorScripts").doc(narratorScriptId), narratorScript);
  batch.set(db.collection("timelineReplayEvents").doc(timelineEventId), timelineEvent);
  await batch.commit();

  return { status: "queued", narratorScriptId, timelineEventId };
});
