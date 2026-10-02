import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

if (getApps().length === 0) initializeApp();

const PrivacyRequestSchema = z.object({
  requestId: z.string().min(8).max(128).regex(/^[A-Za-z0-9._-]+$/),
  type: z.enum(["export", "deletion"]),
  scope: z.enum(["account", "story_session"]),
  sessionId: z.string().min(1).max(256).optional(),
  confirmation: z.literal(true)
}).superRefine((value, ctx) => {
  if (value.scope === "story_session" && !value.sessionId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "sessionId is required for story_session privacy requests." });
  }
  if (value.scope === "account" && value.sessionId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "sessionId is not allowed for account privacy requests." });
  }
});

function requireVerifiedAccount(request: { auth?: { uid: string; token?: { email_verified?: unknown } } | null }) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (request.auth.token?.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Verify the account email before creating a privacy request.");
  }
  return request.auth.uid;
}

export const requestPrivacyOperation = onCall(async (request) => {
  const userId = requireVerifiedAccount(request);
  const parsed = PrivacyRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Provide a valid, explicitly confirmed privacy request.");
  }

  const input = parsed.data;
  const db = getFirestore();

  if (input.scope === "story_session") {
    const session = await db.collection("storySessions").doc(input.sessionId!).get();
    if (!session.exists || session.data()?.userId !== userId) {
      throw new HttpsError("permission-denied", "You do not own that Storytime session.");
    }
  }

  const docId = `${userId}_${input.requestId}`;
  const ref = db.collection("privacyRequests").doc(docId);
  const result = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) {
      const data = existing.data() || {};
      if (data.userId !== userId) throw new HttpsError("permission-denied", "Privacy request is unavailable.");
      return {
        privacyRequestId: existing.id,
        status: String(data.status || "requested"),
        reused: true
      };
    }

    const createdAt = new Date().toISOString();
    transaction.create(ref, {
      schemaVersion: "storytime-privacy-request-v1",
      requestId: input.requestId,
      userId,
      type: input.type,
      scope: input.scope,
      sessionId: input.sessionId || null,
      status: "requested",
      createdAt,
      updatedAt: createdAt,
      executionState: "not_started",
      completionReceiptId: null
    });
    return { privacyRequestId: ref.id, status: "requested", reused: false };
  });

  auditLog({
    event: "privacy_request_created",
    userId,
    errorCode: `${input.type}:${input.scope}`
  });

  return result;
});
