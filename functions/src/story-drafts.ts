import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const DRAFT_STORAGE_CONSENT_VERSION = "story-draft-storage-v1";
const DRAFT_RETENTION_REVIEW_DAYS = 30;

const DraftId = z.string().min(8).max(128).regex(/^[A-Za-z0-9._-]+$/);

const SaveDraftSchema = z.object({
  draftId: DraftId,
  expectedRevision: z.number().int().min(0),
  title: z.string().max(120),
  theme: z.string().max(80),
  sourceText: z.string().max(1200),
  emotionalTone: z.enum(["gentle", "reflective", "playful", "brave", "calm"]),
  audienceAgeBand: z.enum(["family", "preschool_3_5", "early_reader_6_8", "middle_grade_9_12"]),
  locale: z.literal("en-US"),
  operator: z.object({
    role: z.literal("adult_or_guardian"),
    affirmed: z.literal(true)
  }),
  storageConsent: z.object({
    privateDraftStorage: z.literal(true),
    consentVersion: z.literal(DRAFT_STORAGE_CONSENT_VERSION)
  })
});

const DeleteDraftSchema = z.object({
  draftId: DraftId
});

function requireVerifiedOwner(request: { auth?: { uid: string; token?: { email_verified?: unknown } } | null }) {
  const userId = request.auth?.uid;
  if (!userId) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (request.auth?.token?.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Verify the account email before saving private Storytime drafts.");
  }
  return userId;
}

function nowIso() {
  return new Date().toISOString();
}

function retentionReviewAt() {
  return new Date(Date.now() + DRAFT_RETENTION_REVIEW_DAYS * 86_400_000).toISOString();
}

export const saveStoryDraft = onCall(async (request) => {
  const userId = requireVerifiedOwner(request);
  const input = SaveDraftSchema.parse(request.data);
  const ref = db.collection("storyDrafts").doc(input.draftId);

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const existing = snapshot.data() ?? {};

    if (snapshot.exists && existing.userId !== userId) {
      throw new HttpsError("permission-denied", "Storytime draft is unavailable.");
    }

    const currentRevision = snapshot.exists ? Number(existing.revision ?? 0) : 0;
    if (currentRevision !== input.expectedRevision) {
      throw new HttpsError("aborted", "This Storytime draft changed elsewhere. Reload it before saving again.");
    }

    const updatedAt = nowIso();
    const revision = currentRevision + 1;
    const record = {
      schemaVersion: "story-draft-v1",
      id: input.draftId,
      userId,
      revision,
      status: "draft",
      title: input.title.trim(),
      theme: input.theme.trim(),
      sourceText: input.sourceText.trim(),
      emotionalTone: input.emotionalTone,
      audienceAgeBand: input.audienceAgeBand,
      locale: input.locale,
      operatorRoleAtSave: input.operator.role,
      storageConsent: input.storageConsent,
      generationConsentStored: false,
      providerProcessingAuthorized: false,
      createdAt: snapshot.exists ? String(existing.createdAt ?? updatedAt) : updatedAt,
      updatedAt,
      retentionClass: "storytime_private_draft",
      retentionReviewAt: retentionReviewAt()
    };

    transaction.set(ref, record);
    return {
      draftId: input.draftId,
      revision,
      updatedAt,
      retentionReviewAt: record.retentionReviewAt
    };
  });

  auditLog({ event: "story_draft_saved", userId });
  return result;
});

export const deleteStoryDraft = onCall(async (request) => {
  const userId = requireVerifiedOwner(request);
  const input = DeleteDraftSchema.parse(request.data);
  const ref = db.collection("storyDrafts").doc(input.draftId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    if (snapshot.data()?.userId !== userId) {
      throw new HttpsError("permission-denied", "Storytime draft is unavailable.");
    }
    transaction.delete(ref);
  });

  auditLog({ event: "story_draft_deleted", userId });
  return { draftId: input.draftId, deleted: true };
});
