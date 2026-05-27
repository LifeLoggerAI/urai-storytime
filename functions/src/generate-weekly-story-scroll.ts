import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { buildWeeklyStoryScrollRecord } from "./storytime-scroll-builders.js";

if (!getApps().length) initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const RequestSchema = z.object({
  weekStart: z.string().min(1),
  weekEnd: z.string().min(1),
  sessionIds: z.array(z.string().min(1)).min(1).max(14)
});

async function assertOwnedSession(sessionId: string, userId: string) {
  const snap = await db.collection("storySessions").doc(sessionId).get();
  if (!snap.exists || snap.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Story not found.");
  }
  return snap.id;
}

export const generateWeeklyStoryScroll = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError("unauthenticated", "Sign in is required.");

  const input = RequestSchema.parse(request.data);
  const ownedSessionIds = [];
  for (const sessionId of input.sessionIds) {
    ownedSessionIds.push(await assertOwnedSession(sessionId, userId));
  }

  const createdAt = now();
  const weeklyStoryScrollId = id("weeklyStoryScroll");
  const scroll = buildWeeklyStoryScrollRecord({
    id: weeklyStoryScrollId,
    userId,
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    sessionIds: ownedSessionIds,
    createdAt
  });

  await db.collection("weeklyStoryScrolls").doc(weeklyStoryScrollId).set(scroll);

  return { status: "queued", weeklyStoryScrollId, sessionCount: ownedSessionIds.length };
});
