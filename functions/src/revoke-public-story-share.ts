import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";

if (!getApps().length) initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const RequestSchema = z.object({ shareId: z.string().min(1) });

export const revokePublicStoryShare = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError("unauthenticated", "Sign in is required.");

  const input = RequestSchema.parse(request.data);
  const shareRef = db.collection("publicStoryShares").doc(input.shareId);
  const shareSnap = await shareRef.get();

  if (!shareSnap.exists || shareSnap.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Public share not found.");
  }

  const share = shareSnap.data()!;
  const updatedAt = now();
  const batch = db.batch();
  batch.update(shareRef, { revoked: true, updatedAt, revokedAt: updatedAt });

  if (typeof share.sessionId === "string" && share.sessionId) {
    const sessionRef = db.collection("storySessions").doc(share.sessionId);
    const timelineEventId = id("timelineReplayEvent");
    batch.update(sessionRef, { visibility: "private", publicShareId: null, updatedAt });
    batch.set(db.collection("timelineReplayEvents").doc(timelineEventId), {
      id: timelineEventId,
      userId,
      sessionId: share.sessionId,
      eventType: "revoked",
      label: "Public Storytime share revoked",
      metadata: { shareId: input.shareId },
      createdAt: updatedAt,
      updatedAt
    });
  }

  await batch.commit();
  return { status: "revoked", shareId: input.shareId };
});
