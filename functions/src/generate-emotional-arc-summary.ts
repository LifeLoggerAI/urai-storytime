import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { buildEmotionalArcRecord, type StorytimeSessionSnapshot } from "./storytime-record-builders.js";

if (!getApps().length) initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const RequestSchema = z.object({
  sessionId: z.string().min(1),
  arcLabel: z.string().min(1).max(80).default("gentle return")
});

async function ownedSession(sessionId: string, userId: string) {
  const snap = await db.collection("storySessions").doc(sessionId).get();
  if (!snap.exists || snap.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Story not found.");
  }
  return {
    ref: snap.ref,
    data: { id: snap.id, ...snap.data() } as StorytimeSessionSnapshot
  };
}

export const generateEmotionalArcSummary = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError("unauthenticated", "Sign in is required.");

  const input = RequestSchema.parse(request.data);
  const session = await ownedSession(input.sessionId, userId);
  const createdAt = now();
  const emotionalArcSummaryId = id("emotionalArc");

  const arc = buildEmotionalArcRecord({
    id: emotionalArcSummaryId,
    session: session.data,
    arcLabel: input.arcLabel,
    createdAt
  });

  const batch = db.batch();
  batch.set(db.collection("emotionalArcSummaries").doc(emotionalArcSummaryId), arc);
  batch.update(session.ref, { emotionalArcSummaryId, updatedAt: createdAt });
  await batch.commit();

  return { status: "queued", emotionalArcSummaryId };
});
