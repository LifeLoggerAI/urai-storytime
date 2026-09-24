import { getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore, type DocumentData } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const MODERATION_SCHEMA_VERSION = "storytime-moderation-review-v1";
const MODERATION_AUDIT_SCHEMA_VERSION = "storytime-moderation-audit-v1";

const CaseRequestSchema = z.object({
  moderationId: z.string().min(1).max(300)
});

const ListRequestSchema = z.object({
  status: z.enum(["pending", "escalated", "resolved_blocked"]).default("pending"),
  limit: z.number().int().min(1).max(50).default(25)
});

const TransitionRequestSchema = z.object({
  moderationId: z.string().min(1).max(300),
  action: z.enum(["escalate", "close_blocked"]),
  reasonCode: z.enum([
    "requires_secure_content_review",
    "policy_block_confirmed",
    "duplicate_case",
    "operational_test"
  ])
});

type AdminAuth = {
  uid: string;
  token?: Record<string, unknown>;
};

function requireAdmin(auth: AdminAuth | null | undefined) {
  if (!auth?.uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (auth.token?.admin !== true && auth.token?.role !== "admin") {
    throw new HttpsError("permission-denied", "Storytime moderation requires trusted admin authority.");
  }
  return auth.uid;
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 20)
    : [];
}

function timestampValue(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : null;
}

function sanitizedCase(id: string, data: DocumentData) {
  return {
    moderationId: id,
    schemaVersion: data.schemaVersion === MODERATION_SCHEMA_VERSION ? MODERATION_SCHEMA_VERSION : "unknown",
    requestId: typeof data.requestId === "string" ? data.requestId : null,
    stage: data.stage === "input" || data.stage === "output" || data.stage === "user_report" ? data.stage : "unknown",
    status: typeof data.status === "string" ? data.status : "unknown",
    reasonCodes: stringList(data.reasonCodes),
    contentSha256: typeof data.contentSha256 === "string" ? data.contentSha256 : null,
    containsRawStoryContent: data.containsRawStoryContent === true,
    createdAt: timestampValue(data.createdAt),
    updatedAt: timestampValue(data.updatedAt),
    lastAction: typeof data.lastAction === "string" ? data.lastAction : null,
    lastReasonCode: typeof data.lastReasonCode === "string" ? data.lastReasonCode : null
  };
}

function assertReviewableCase(data: DocumentData) {
  if (data.schemaVersion !== MODERATION_SCHEMA_VERSION) {
    throw new HttpsError("failed-precondition", "Storytime moderation case schema is not reviewable.");
  }
  if (data.containsRawStoryContent === true) {
    throw new HttpsError("failed-precondition", "Raw story content is not allowed in the Storytime moderation queue.");
  }
  if (typeof data.contentSha256 !== "string" || data.contentSha256.length !== 64) {
    throw new HttpsError("failed-precondition", "Storytime moderation case lacks its content fingerprint.");
  }
}

export const listStorytimeModerationCases = onCall(async (request) => {
  requireAdmin(request.auth as AdminAuth | null | undefined);
  const input = ListRequestSchema.parse(request.data ?? {});
  const snapshot = await db.collection("moderation")
    .where("status", "==", input.status)
    .limit(input.limit)
    .get();

  return {
    schemaVersion: "storytime-moderation-admin-list-v1",
    status: input.status,
    cases: snapshot.docs.map((doc) => sanitizedCase(doc.id, doc.data()))
  };
});

export const getStorytimeModerationCase = onCall(async (request) => {
  requireAdmin(request.auth as AdminAuth | null | undefined);
  const input = CaseRequestSchema.parse(request.data);
  const snapshot = await db.collection("moderation").doc(input.moderationId).get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Storytime moderation case was not found.");

  const data = snapshot.data() ?? {};
  assertReviewableCase(data);
  return sanitizedCase(snapshot.id, data);
});

export const transitionStorytimeModerationCase = onCall(async (request) => {
  const actorUid = requireAdmin(request.auth as AdminAuth | null | undefined);
  const input = TransitionRequestSchema.parse(request.data);
  const caseRef = db.collection("moderation").doc(input.moderationId);
  const auditRef = db.collection("moderationAuditLogs").doc();
  const now = Timestamp.now();

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(caseRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "Storytime moderation case was not found.");

    const data = snapshot.data() ?? {};
    assertReviewableCase(data);
    const priorStatus = typeof data.status === "string" ? data.status : "pending";

    if (!["pending", "escalated"].includes(priorStatus)) {
      throw new HttpsError("failed-precondition", "Storytime moderation case is already terminal.");
    }

    const nextStatus = input.action === "escalate" ? "escalated" : "resolved_blocked";
    if (priorStatus === "escalated" && nextStatus === "escalated") {
      return { priorStatus, nextStatus, reused: true };
    }

    transaction.update(caseRef, {
      status: nextStatus,
      lastAction: input.action,
      lastReasonCode: input.reasonCode,
      updatedAt: now
    });

    transaction.create(auditRef, {
      schemaVersion: MODERATION_AUDIT_SCHEMA_VERSION,
      moderationId: input.moderationId,
      actorUid,
      action: input.action,
      reasonCode: input.reasonCode,
      priorStatus,
      nextStatus,
      contentSha256: data.contentSha256,
      containsRawStoryContent: false,
      createdAt: now
    });

    return { priorStatus, nextStatus, reused: false };
  });

  auditLog({
    event: input.action === "escalate" ? "moderation_case_escalated" : "moderation_case_closed_blocked",
    errorCode: input.reasonCode
  });

  return {
    moderationId: input.moderationId,
    status: result.nextStatus,
    reused: result.reused,
    releaseAuthorized: false,
    secureContentReviewAvailable: false
  };
});
