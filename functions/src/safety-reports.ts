import { createHash } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const REPORT_SCHEMA_VERSION = "storytime-safety-report-v1";
const MODERATION_SCHEMA_VERSION = "storytime-moderation-review-v1";
const MAX_SAFETY_REPORTS_PER_DAY = Number(process.env.STORYTIME_MAX_SAFETY_REPORTS_PER_DAY || 10);

const ReportSchema = z.object({
  requestId: z.string().min(8).max(128).regex(/^[A-Za-z0-9._-]+$/),
  sessionId: z.string().min(1).max(300),
  category: z.enum([
    "unsafe_content",
    "privacy_concern",
    "wrong_personal_detail",
    "sharing_concern",
    "other_safety_concern"
  ]),
  confirmation: z.literal(true)
});

function requireAuth(uid?: string) {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in is required.");
  return uid;
}

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function utcDayId(date = new Date()) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

export const reportStorytimeSafetyConcern = onCall(async (request) => {
  const userId = requireAuth(request.auth?.uid);
  const input = ReportSchema.parse(request.data);
  const sessionRef = db.collection("storySessions").doc(input.sessionId);
  const reportId = `${userId}_${input.requestId}`;
  const reportRef = db.collection("storySafetyReports").doc(reportId);
  const moderationRef = db.collection("moderation").doc(`safetyReport_${digest(reportId).slice(0, 40)}`);
  const counterRef = db.collection("storytimeSafetyReportCounters").doc(`${userId}_${utcDayId()}`);

  const result = await db.runTransaction(async (transaction) => {
    const [sessionSnapshot, reportSnapshot, counterSnapshot] = await Promise.all([
      transaction.get(sessionRef),
      transaction.get(reportRef),
      transaction.get(counterRef)
    ]);

    if (!sessionSnapshot.exists || sessionSnapshot.data()?.userId !== userId) {
      throw new HttpsError("permission-denied", "You do not own that Storytime session.");
    }

    if (reportSnapshot.exists) {
      const data = reportSnapshot.data() ?? {};
      if (data.userId !== userId) throw new HttpsError("permission-denied", "Safety report is unavailable.");
      return {
        reportId: reportSnapshot.id,
        moderationId: typeof data.moderationId === "string" ? data.moderationId : moderationRef.id,
        reused: true
      };
    }

    const reportCount = Number(counterSnapshot.data()?.count || 0);
    if (reportCount >= MAX_SAFETY_REPORTS_PER_DAY) {
      throw new HttpsError("resource-exhausted", "Daily Storytime safety-report limit reached. Try again later.");
    }

    const session = sessionSnapshot.data() ?? {};
    const now = Timestamp.now();
    const targetFingerprintSha256 = digest(
      JSON.stringify({
        sessionId: input.sessionId,
        requestId: session.requestId ?? null,
        updatedAt: session.updatedAt ?? null,
        safetyStatus: session.safetyStatus ?? null
      })
    );

    transaction.set(counterRef, {
      userId,
      scope: "day",
      count: reportCount + 1,
      updatedAt: now
    }, { merge: true });

    transaction.create(reportRef, {
      schemaVersion: REPORT_SCHEMA_VERSION,
      userId,
      sessionId: input.sessionId,
      category: input.category,
      status: "submitted",
      moderationId: moderationRef.id,
      targetFingerprintSha256,
      containsRawStoryContent: false,
      createdAt: now,
      updatedAt: now
    });

    transaction.set(moderationRef, {
      schemaVersion: MODERATION_SCHEMA_VERSION,
      userId,
      requestId: input.requestId,
      stage: "user_report",
      status: "pending",
      reasonCodes: [`user_report:${input.category}`],
      contentSha256: targetFingerprintSha256,
      fingerprintKind: "target_reference",
      containsRawStoryContent: false,
      reportId,
      createdAt: now,
      updatedAt: now
    }, { merge: false });

    return { reportId, moderationId: moderationRef.id, reused: false };
  });

  auditLog({
    event: "safety_report_created",
    userId,
    sessionId: input.sessionId,
    errorCode: input.category
  });

  return {
    reportId: result.reportId,
    moderationId: result.moderationId,
    status: "submitted",
    reused: result.reused,
    emergencyMonitoringProvided: false
  };
});
