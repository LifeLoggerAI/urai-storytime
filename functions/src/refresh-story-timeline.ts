import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { buildTimelineEventRecord } from "./storytime-record-builders.js";

if (!getApps().length) initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const RequestSchema = z.object({
  sessionId: z.string().min(1),
  label: z.string().min(1).max(120).default("Story timeline refreshed")
});

async function assertOwnedSession(sessionId: string, userId: string) {
  const snap = await db.collection("storySessions").doc(sessionId).get();
  if (!snap.exists || snap.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Story not found.");
  }
}

export const refreshStoryTimeline = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError("unauthenticated", "Sign in is required.");

  const input = RequestSchema.parse(request.data);
  await assertOwnedSession(input.sessionId, userId);
  const createdAt = now();
  const timelineEventId = id("timelineReplayEvent");

  const event = buildTimelineEventRecord({
    id: timelineEventId,
    userId,
    sessionId: input.sessionId,
    label: input.label,
    action: "refreshStoryTimeline",
    createdAt
  });

  await db.collection("timelineReplayEvents").doc(timelineEventId).set(event);

  return { status: "queued", timelineEventId };
});
