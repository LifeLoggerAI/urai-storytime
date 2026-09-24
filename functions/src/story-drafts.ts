import { getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const DRAFT_SCHEMA_VERSION = "storytime-draft-v1";
const DRAFT_STORAGE_CONSENT_VERSION = "storytime-draft-storage-consent-v1";
const DRAFT_RETENTION_DAYS = 30;

const DraftInputSchema = z.object({
  title: z.string().max(120),
  theme: z.string().max(80),
  audienceAgeBand: z.enum(["family", "preschool_3_5", "early_reader_6_8", "middle_grade_9_12"]),
  mood: z.enum(["gentle", "reflective", "playful", "brave", "calm"]),
  sourceText: z.string().max(1200),
  locale: z.literal("en-US"),
  draftStorageConsent: z.literal(true),
  draftStorageConsentVersion: z.literal(DRAFT_STORAGE_CONSENT_VERSION)
}).strict();

function requireVerifiedUser(request: { auth?: { uid: string; token?: { email_verified?: unknown } } | null }) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (request.auth?.token?.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Verify the account email before storing a Storytime draft.");
  }
  return uid;
}

function draftRef(userId: string) {
  return db.collection("storyDrafts").doc(`${userId}_active`);
}

export const saveStoryDraft = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  const parsed = DraftInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Provide a valid private Storytime draft with explicit draft-storage consent.");
  }

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + DRAFT_RETENTION_DAYS * 86_400_000);
  const ref = draftRef(userId);
  const existing = await ref.get();
  const createdAt = existing.data()?.createdAt instanceof Timestamp ? existing.data()?.createdAt : now;
  await ref.set({
    schemaVersion: DRAFT_SCHEMA_VERSION,
    userId,
    ...parsed.data,
    status: "draft",
    providerSubmitted: false,
    publicSharingAuthorized: false,
    createdAt,
    updatedAt: now,
    expiresAt
  }, { merge: true });

  auditLog({ event: "story_draft_saved", userId });
  return {
    status: "saved",
    draftId: ref.id,
    updatedAt: now.toDate().toISOString(),
    expiresAt: expiresAt.toDate().toISOString()
  };
});

export const getStoryDraft = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  const snapshot = await draftRef(userId).get();
  if (!snapshot.exists) return { status: "empty", draft: null };

  const data = snapshot.data() ?? {};
  const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt : null;
  if (expiresAt && expiresAt.toMillis() <= Date.now()) {
    await snapshot.ref.delete();
    return { status: "empty", draft: null };
  }

  return {
    status: "ready",
    draft: {
      title: typeof data.title === "string" ? data.title : "",
      theme: typeof data.theme === "string" ? data.theme : "",
      audienceAgeBand: data.audienceAgeBand,
      mood: data.mood,
      sourceText: typeof data.sourceText === "string" ? data.sourceText : "",
      locale: data.locale === "en-US" ? "en-US" : "en-US",
      draftStorageConsent: data.draftStorageConsent === true,
      draftStorageConsentVersion: data.draftStorageConsentVersion,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
      expiresAt: expiresAt ? expiresAt.toDate().toISOString() : null
    }
  };
});

export const deleteStoryDraft = onCall(async (request) => {
  const userId = requireVerifiedUser(request);
  await draftRef(userId).delete();
  auditLog({ event: "story_draft_deleted", userId });
  return { status: "deleted" };
});
