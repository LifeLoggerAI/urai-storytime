import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";

if (!getApps().length) initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
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
  const batch = db.batch();
  batch.update(shareRef, { revoked: true, updatedAt: now(), revokedAt: now() });

  if (typeof share.sessionId === "string" && share.sessionId) {
    const sessionRef = db.collection("storySessions").doc(share.sessionId);
    batch.update(sessionRef, { visibility: "private", publicShareId: null, updatedAt: now() });
    batch.set(db.collection("timelineReplayEvents").doc(`timelineReplayEvent_${Date.now()}`), {
      id: `timelineReplayEvent_${Date.now()}`,
      userId,
      sessionId: share.sessionId,
      eventType: "revoked",
      label: "Public Storytime share revoked",
      metadata: { shareId: input.shareId },
      createdAt: now(),
      updatedAt: now()
    });
  }

  await batch.commit();
  return { status: "revoked", shareId: input.shareId };
});
