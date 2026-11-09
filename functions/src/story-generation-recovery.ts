import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { isReusableStorytimeSession } from "./storytime-request-binding.js";
import { sanitizeStorytimeRecoveryReceipt } from "./story-generation-recovery-contract.js";

if (getApps().length === 0) initializeApp();
const db = getFirestore();

const RecoveryQuery = z.object({
  requestId: z.string().min(8).max(128).regex(/^[A-Za-z0-9._-]+$/).optional(),
}).strict();

const MAX_RECENT_RECEIPTS = 12;

/**
 * Read-only lookup of the caller's own generation status, including after a
 * reload. The server never returns original text, source labels, prompt hashes,
 * consent details, billing receipts or session URLs for unverified outputs.
 *
 * This is not permission to resubmit, settle a provider charge, or approve
 * private source processing. Do not use it to trigger generation.
 */
export const getStorytimeGenerationRecovery = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError("unauthenticated", "Sign in is required.");
  if (request.auth?.token.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Verify the account email first.");
  }
  const input = RecoveryQuery.parse(request.data ?? {});

  // A specific ID has a direct owner-prefixed lookup; listing uses a server
  // query and a bounded maximum. Do not enumerate or expose another owner's IDs.
  const snapshot = input.requestId
    ? null
    : await db.collection("storyGenerationRequests")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(MAX_RECENT_RECEIPTS)
        .get();
  const rows = snapshot
    ? snapshot.docs.map((doc) => doc.data() || {})
    : [await db.collection("storyGenerationRequests")
        .doc(`${userId}_${input.requestId}`)
        .get()].filter((doc) => doc.exists).map((doc) => doc.data() || {});

  const items = [];
  for (const record of rows) {
    if (record.userId !== userId) continue;
    let verifiedSessionId: string | null = null;
    if (record.status === "succeeded"
      && record.cancellationRequested !== true
      && typeof record.sessionId === "string"
      && /^[A-Za-z0-9_-]{8,128}$/.test(record.sessionId)
      && typeof record.reviewedRequestSha256 === "string") {
      const story = await db.collection("storySessions").doc(record.sessionId).get();
      if (story.exists && isReusableStorytimeSession(
        story.data(), userId, record.requestId, record.reviewedRequestSha256
      )) {
        verifiedSessionId = record.sessionId;
      }
    }
    const receipt = sanitizeStorytimeRecoveryReceipt(record, userId, verifiedSessionId);
    if (receipt) items.push(receipt);
  }

  return { items, retryAuthorized: false, requiresOwnerReview: true };
});
