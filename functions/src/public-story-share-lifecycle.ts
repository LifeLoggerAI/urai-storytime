import "./storytime.js";

import { FieldValue, Timestamp, getFirestore, type DocumentData } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

const createShareSchema = z.object({
  sessionId: z.string().min(1),
  expiresInDays: z.number().int().min(1).max(90).optional()
});

const revokeShareSchema = z.object({
  shareId: z.string().min(1)
});

function requireAuth(request: { auth?: { uid: string } | null }) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  return request.auth.uid;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "story";
}

function redactPublicText(value: unknown) {
  const text = typeof value === "string" ? value : "";
  return text
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted email]")
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[redacted phone]")
    .replace(/\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi, "[redacted address]")
    .trim();
}

function timestamp(value: unknown) {
  return value instanceof Timestamp ? value : null;
}

function activeSanitizedShare(data: DocumentData | undefined, nowMs: number) {
  const expiresAt = timestamp(data?.expiresAt);
  return data?.revoked === false
    && expiresAt !== null
    && expiresAt.toMillis() > nowMs
    && !("userId" in (data ?? {}))
    && !("sessionId" in (data ?? {}));
}

export const createPublicStoryShare = onCall(async (request) => {
  const userId = requireAuth(request);
  const input = createShareSchema.parse(request.data);
  const db = getFirestore();
  const sessionRef = db.collection("storySessions").doc(input.sessionId);
  const newShareRef = db.collection("publicStoryShares").doc();
  const newControlRef = db.collection("publicStoryShareControls").doc(newShareRef.id);

  const result = await db.runTransaction(async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);
    if (!sessionSnapshot.exists) {
      throw new HttpsError("not-found", "Story session was not found.");
    }

    const session = sessionSnapshot.data() ?? {};
    if (session.userId !== userId) {
      throw new HttpsError("permission-denied", "You do not own this story session.");
    }
    if (session.consentSnapshot?.publicSharing !== true) {
      throw new HttpsError("failed-precondition", "Public sharing consent is required.");
    }
    if (session.safetyStatus !== "approved") {
      throw new HttpsError("failed-precondition", "Only safety-approved stories can be shared.");
    }

    const now = Timestamp.now();
    const nowMs = now.toMillis();
    const existingShareId = typeof session.publicShareId === "string" ? session.publicShareId : null;

    if (existingShareId) {
      const existingShareRef = db.collection("publicStoryShares").doc(existingShareId);
      const existingControlRef = db.collection("publicStoryShareControls").doc(existingShareId);
      const [existingShare, existingControl] = await Promise.all([
        transaction.get(existingShareRef),
        transaction.get(existingControlRef)
      ]);
      const publicData = existingShare.data();
      const controlData = existingControl.data();
      if (
        existingShare.exists
        && existingControl.exists
        && controlData?.userId === userId
        && controlData?.sessionId === input.sessionId
        && controlData?.revoked === false
        && activeSanitizedShare(publicData, nowMs)
      ) {
        return {
          shareId: existingShare.id,
          slug: String(publicData?.slug ?? existingShare.id),
          expiresAt: timestamp(publicData?.expiresAt)?.toDate().toISOString() ?? null,
          reused: true
        };
      }
    }

    const expiresAt = Timestamp.fromMillis(nowMs + (input.expiresInDays ?? 30) * 86_400_000);
    const title = redactPublicText(session.title || "Your Story").slice(0, 140) || "Your Story";
    const slug = `${slugify(title)}-${newShareRef.id.slice(-8)}`;
    const safeSummary = redactPublicText(session.whyGenerated || "A private story was shared safely.").slice(0, 500);
    const safeBody = "This public-safe story view was created from a private URAI Storytime session. Private signals, identifiers, relationship details, and source records are not included.";

    transaction.create(newShareRef, {
      schemaVersion: "public-story-share-v2",
      slug,
      title,
      safeSummary,
      safeBody,
      revoked: false,
      createdAt: now,
      updatedAt: now,
      expiresAt
    });
    transaction.create(newControlRef, {
      schemaVersion: "public-story-share-control-v1",
      userId,
      sessionId: input.sessionId,
      revoked: false,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      consentSnapshot: { publicSharing: true }
    });
    transaction.update(sessionRef, {
      publicShareId: newShareRef.id,
      visibility: "public_safe",
      updatedAt: now.toDate().toISOString()
    });

    return {
      shareId: newShareRef.id,
      slug,
      expiresAt: expiresAt.toDate().toISOString(),
      reused: false
    };
  });

  auditLog({ event: "public_share_created", userId, sessionId: input.sessionId, shareId: result.shareId });
  return result;
});

export const revokePublicStoryShare = onCall(async (request) => {
  const userId = requireAuth(request);
  const input = revokeShareSchema.parse(request.data);
  const db = getFirestore();
  const publicRef = db.collection("publicStoryShares").doc(input.shareId);
  const controlRef = db.collection("publicStoryShareControls").doc(input.shareId);

  const result = await db.runTransaction(async (transaction) => {
    const [publicSnapshot, controlSnapshot] = await Promise.all([
      transaction.get(publicRef),
      transaction.get(controlRef)
    ]);
    if (!publicSnapshot.exists) {
      throw new HttpsError("not-found", "Public Storytime share was not found.");
    }

    const publicData = publicSnapshot.data() ?? {};
    const controlData = controlSnapshot.data() ?? {};
    const ownerId = controlSnapshot.exists ? controlData.userId : publicData.userId;
    const sessionId = controlSnapshot.exists ? controlData.sessionId : publicData.sessionId;
    if (ownerId !== userId) {
      throw new HttpsError("permission-denied", "You do not own this Storytime share.");
    }

    const sessionRef = typeof sessionId === "string" && sessionId.length > 0
      ? db.collection("storySessions").doc(sessionId)
      : null;
    const sessionSnapshot = sessionRef ? await transaction.get(sessionRef) : null;
    const alreadyRevoked = publicData.revoked === true && controlData.revoked === true;
    if (alreadyRevoked) {
      return { shareId: input.shareId, sessionId, alreadyRevoked: true };
    }

    const now = Timestamp.now();
    transaction.set(publicRef, {
      revoked: true,
      revokedAt: now,
      updatedAt: now,
      userId: FieldValue.delete(),
      sessionId: FieldValue.delete()
    }, { merge: true });
    transaction.set(controlRef, {
      schemaVersion: "public-story-share-control-v1",
      userId,
      sessionId,
      revoked: true,
      revokedAt: now,
      updatedAt: now,
      migratedFromLegacy: !controlSnapshot.exists
    }, { merge: true });

    if (sessionRef && sessionSnapshot?.exists && sessionSnapshot.data()?.userId === userId) {
      transaction.update(sessionRef, {
        publicShareId: FieldValue.delete(),
        visibility: "private",
        updatedAt: now.toDate().toISOString()
      });
    }

    return { shareId: input.shareId, sessionId, alreadyRevoked: false };
  });

  auditLog({ event: "public_share_revoked", userId, sessionId: typeof result.sessionId === "string" ? result.sessionId : undefined, shareId: result.shareId });
  return { shareId: result.shareId, revoked: true, alreadyRevoked: result.alreadyRevoked };
});
