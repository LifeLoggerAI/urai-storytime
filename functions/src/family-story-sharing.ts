/**
 * Family Stories review-only Firebase callable surface. Real Auth context is
 * reverified with checkRevoked, and read/write decisions bind to canonical
 * Privacy decision receipts. Canonical purpose registration and live dispatch
 * are NOT completed: disabled in every ordinary deployment by default.
 * All documents, receipts and sharing state are server write only.
 */
import { createHash } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore, type Transaction } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireCurrentStorytimeOwner } from "./privacy-actor.js";
import { verifyFamilyPrivacyReceiptSignature, type FamilyPrivacySignedFields } from "./family-privacy-receipt-signature.js";

if (!getApps().length) initializeApp();
const db = getFirestore();
const purpose = "storytime.family_share";
const policyVersion = "family-story-share-v1";
const flag = "STORYTIME_FAMILY_SHARING_ENABLED";
const ID = z.string().min(1).max(220).regex(/^[A-Za-z0-9._-]+$/);
const grantInput = z.object({
  sessionId: ID, recipientUid: ID, consentReceiptId: ID,
  expiresInDays: z.number().int().min(1).max(30),
}).strict();
const viewInput = z.object({ sessionId: ID, ownerUid: ID }).strict();
const revokeInput = z.object({ sessionId: ID, recipientUid: ID }).strict();

function enabled() {
  if (process.env[flag] !== "true") throw new HttpsError("failed-precondition", "Private family sharing is not approved or enabled.");
}
function hid(sessionId: string, recipientUid: string) {
  return createHash("sha256").update(JSON.stringify([sessionId, recipientUid])).digest("hex");
}
/** Bind the precise sanitized text approved by the owner to the canonical
 * purpose/recipient consent receipt. Version-only matching is insufficient:
 * a chapter summary may be edited without changing a session version.
 */
function approvedProjection(story: Record<string, any>, chapter: Record<string, any>, ownerUid: string, sessionId: string) {
  if (typeof story.title !== "string" || !story.title.trim() || story.title.length > 200
    || chapter.userId !== ownerUid || chapter.sessionId !== sessionId
    || typeof chapter.summary !== "string" || !chapter.summary.trim()
    || chapter.summary.length > 4000) throw safeError();
  const title = story.title, summary = chapter.summary;
  const digest = createHash("sha256").update(JSON.stringify({
    sourceSystem: "urai-storytime", ownerUid, sessionId,
    versionId: story.currentVersionId, title, summary,
  })).digest("hex");
  return { title, summary, digest };
}
function chapterRefFor(story: Record<string, any>) {
  const ids = story.chapterIds;
  if (!Array.isArray(ids) || ids.length !== 1 || !ID.safeParse(ids[0]).success) throw safeError();
  return db.collection("storyChapters").doc(ids[0] as string);
}
function safeError() {
  return new HttpsError("permission-denied", "This family story is not available.");
}
function activeSource(session: Record<string, any>, ownerUid: string) {
  return session.userId === ownerUid && session.safetyStatus === "approved"
    && session.visibility === "private" && session.deleted !== true
    && session.revoked !== true && session.retired !== true
    && session.status === "ready" && typeof session.currentVersionId === "string"
    && session.currentVersionId.length > 0
    && session.consentSnapshot?.memoryUse === true;
}
function currentReceipt(receipt: Record<string, any>, input: {
  ownerUid: string; sessionId: string; recipientUid: string; consentReceiptId: string;
  versionId: string; epoch: number; nowMs: number; projectionDigest: string;
}) {
  const signed: FamilyPrivacySignedFields = {
    schemaVersion: receipt.schemaVersion,
    id: receipt.id, userId: receipt.userId,
    sourceSessionId: receipt.sourceSessionId, recipientUid: receipt.recipientUid,
    sourceVersionId: receipt.sourceVersionId, shareEpoch: receipt.shareEpoch,
    purpose: receipt.purpose, policyVersion: receipt.policyVersion,
    decision: receipt.decision, issuedBy: receipt.issuedBy,
    approvedProjectionSha256: receipt.approvedProjectionSha256,
    expiresAtMs: receipt.expiresAt instanceof Timestamp ? receipt.expiresAt.toMillis() : -1,
  };
  return verifyFamilyPrivacyReceiptSignature(signed, receipt.issuerSignature, receipt.issuerKeyId)
    && receipt.schemaVersion === "storytime-consent-decision-receipt-v1"
    && receipt.id === input.consentReceiptId
    && receipt.userId === input.ownerUid
    && receipt.sourceSessionId === input.sessionId
    && receipt.recipientUid === input.recipientUid
    && receipt.sourceVersionId === input.versionId
    && receipt.shareEpoch === input.epoch
    && receipt.purpose === purpose && receipt.policyVersion === policyVersion
    && receipt.decision === "authorized" && receipt.revoked !== true
    && receipt.issuedBy === "urai-privacy"
    && receipt.approvedProjectionSha256 === input.projectionDigest
    && receipt.expiresAt instanceof Timestamp
    && receipt.expiresAt.toMillis() > input.nowMs;
}
/** Auth and Firestore are independent authorities. A deleted/disabled source
 * owner must not remain shareable while downstream document deletion is pending. */
async function requireActiveSourceOwner(ownerUid: string) {
  const owner = await getAuth().getUser(ownerUid).catch(() => { throw safeError(); });
  if (owner.uid !== ownerUid || owner.disabled || !owner.emailVerified) throw safeError();
}
async function assertNoDeletionFence(tx: Transaction, ...uids: string[]) {
  // Match Jobs' canonical ownerDeletionFenceRefs/ownerDeletionFenced contract.
  // Both owner and recipient are fenced if EITHER a pending account deletion
  // fence or a Privacy deletion tombstone exists. A malformed or legacy
  // tombstone without an `active` property is still a deletion marker.
  const unique = [...new Set(uids)];
  const refs = unique.flatMap((uid) => [
    db.collection("accountDeletionFences").doc(uid),
    db.collection("privacyDeletionTombstones").doc(uid),
  ]);
  const fences = await Promise.all(refs.map((ref) => tx.get(ref)));
  if (fences.some((snapshot) => snapshot.exists)) throw safeError();
}
function provenanceLabel(value: unknown) {
  // Do not pass nested private metadata through a purported classification.
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,79}$/.test(value)
    ? value : "unverified";
}
function stateRef(sessionId: string) {
  return db.collection("familyStorySharingStates").doc(sessionId);
}
function grantRef(sessionId: string, recipientUid: string) {
  return db.collection("familyStoryViewGrants").doc(hid(sessionId, recipientUid));
}
function readEpoch(data: Record<string, any> | undefined) {
  if (!data) return 0;
  if (!Number.isSafeInteger(data.shareEpoch) || data.shareEpoch < 0) throw safeError();
  return data.shareEpoch as number;
}
async function verifiedActor(request: Parameters<typeof requireCurrentStorytimeOwner>[0]) {
  // Uses existing verifyIdToken(token, true), getUser, verifyIdToken(token, true)
  // with account.emailVerified and disabled checks.
  return requireCurrentStorytimeOwner(request);
}

/** Server-issued named grants require already-existing canonical Privacy receipts.
 * A signed-in client cannot create a receipt or grant with Firestore Rules.
 */
export const grantFamilyStoryView = onCall(async (request) => {
  enabled();
  const ownerUid = await verifiedActor(request);
  const parsed = grantInput.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Invalid family story grant.");
  const { sessionId, recipientUid, consentReceiptId, expiresInDays } = parsed.data;
  if (recipientUid === ownerUid) throw new HttpsError("invalid-argument", "Recipient must differ from owner.");
  const recipient = await getAuth().getUser(recipientUid).catch(() => { throw safeError(); });
  if (recipient.disabled || !recipient.emailVerified) throw safeError();

  const result = await db.runTransaction(async (tx) => {
    const sRef = db.collection("storySessions").doc(sessionId);
    const pRef = db.collection("consentDecisionReceipts").doc(consentReceiptId);
    const eRef = stateRef(sessionId), gRef = grantRef(sessionId, recipientUid);
    const [s, p, e, g] = await Promise.all([tx.get(sRef), tx.get(pRef), tx.get(eRef), tx.get(gRef)]);
    await assertNoDeletionFence(tx, ownerUid, recipientUid);
    const story = s.data() ?? {}, receipt = p.data() ?? {}, epoch = readEpoch(e.data());
    const nowMs = Date.now();
    if (!s.exists || !activeSource(story, ownerUid)) throw safeError();
    const chapterSnap = await tx.get(chapterRefFor(story));
    if (!chapterSnap.exists) throw safeError();
    const projection = approvedProjection(story, chapterSnap.data() ?? {}, ownerUid, sessionId);
    if (!p.exists || !currentReceipt(receipt, {
        ownerUid, sessionId, recipientUid, consentReceiptId,
        versionId: story.currentVersionId, epoch, nowMs, projectionDigest: projection.digest
      })) throw safeError();
    const expiry = Math.min(nowMs + expiresInDays * 86_400_000, receipt.expiresAt.toMillis());
    if (expiry <= nowMs) throw safeError();
    // A stale client cannot reissue a revoked grant with an old receipt.
    if (g.exists && g.data()?.status === "revoked") throw safeError();
    tx.set(gRef, {
      schemaVersion: "storytime-named-family-grant-v1",
      sessionId, ownerUid, recipientUid, consentReceiptId,
      sourceVersionId: story.currentVersionId,
      approvedProjectionSha256: projection.digest,
      shareEpoch: epoch, status: "active", scopes: ["view_story"],
      ownerApproved: true, issuedAt: Timestamp.fromMillis(nowMs),
      expiresAt: Timestamp.fromMillis(expiry), updatedAt: FieldValue.serverTimestamp(),
    });
    return { granted: true, sessionId, recipientUid, expiresAt: new Date(expiry).toISOString() };
  });
  await verifiedActor(request);
  return result;
});

/** Return only a narrow textual projection of one exact story. No raw media
 * bytes, narrator script, other stories, relationships or asset locations.
 */
export const getFamilyStoryView = onCall(async (request) => {
  enabled();
  const recipientUid = await verifiedActor(request);
  const parsed = viewInput.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Invalid family story request.");
  const { sessionId, ownerUid } = parsed.data;
  if (recipientUid === ownerUid) throw safeError(); // owners use existing owner-only APIs
  await requireActiveSourceOwner(ownerUid);
  const projection = await db.runTransaction(async (tx: Transaction) => {
    const sRef = db.collection("storySessions").doc(sessionId);
    const gRef = grantRef(sessionId, recipientUid), eRef = stateRef(sessionId);
    const [s, g, e] = await Promise.all([tx.get(sRef), tx.get(gRef), tx.get(eRef)]);
    await assertNoDeletionFence(tx, ownerUid, recipientUid);
    const story = s.data() ?? {}, grant = g.data() ?? {};
    const epoch = readEpoch(e.data()), nowMs = Date.now();
    if (!s.exists || !activeSource(story, ownerUid) || !g.exists
      || grant.schemaVersion !== "storytime-named-family-grant-v1"
      || grant.ownerUid !== ownerUid || grant.recipientUid !== recipientUid
      || grant.sessionId !== sessionId || grant.ownerApproved !== true
      || grant.status !== "active" || grant.shareEpoch !== epoch
      || grant.sourceVersionId !== story.currentVersionId
      || !Array.isArray(grant.scopes) || !grant.scopes.includes("view_story")
      || !(grant.expiresAt instanceof Timestamp)
      || grant.expiresAt.toMillis() <= nowMs
      || typeof grant.consentReceiptId !== "string") throw safeError();
    const chapterSnapshot = await tx.get(chapterRefFor(story));
    if (!chapterSnapshot.exists) throw safeError();
    const projection = approvedProjection(story, chapterSnapshot.data() ?? {}, ownerUid, sessionId);
    if (grant.approvedProjectionSha256 !== projection.digest) throw safeError();
    const receiptSnap = await tx.get(db.collection("consentDecisionReceipts").doc(grant.consentReceiptId));
    if (!receiptSnap.exists || !currentReceipt(receiptSnap.data() ?? {}, {
      ownerUid, sessionId, recipientUid, consentReceiptId: grant.consentReceiptId,
      versionId: story.currentVersionId, epoch, nowMs, projectionDigest: projection.digest
    })) throw safeError();
    // Only signed, exact owner-approved projection; do not leak nested provenance.
    return { sessionId, ownerUid, title: projection.title, summary: projection.summary,
      provenance: { type: provenanceLabel(story.provenance?.sourceType),
        factualStatus: provenanceLabel(story.provenance?.factualStatus) } };
  });
  // Recheck the source-owner account and recipient after the transaction.
  await requireActiveSourceOwner(ownerUid);
  await verifiedActor(request);
  return projection;
});

/** Revocation is a transactional epoch advance: every prior grant for the story
 * becomes stale, including cached grant IDs. No media/URL capability is issued.
 */
export const revokeFamilyStoryView = onCall(async (request) => {
  enabled();
  const ownerUid = await verifiedActor(request);
  const parsed = revokeInput.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Invalid family story revoke.");
  const { sessionId, recipientUid } = parsed.data;
  const response = await db.runTransaction(async (tx) => {
    const sRef = db.collection("storySessions").doc(sessionId),
      eRef = stateRef(sessionId), gRef = grantRef(sessionId, recipientUid);
    const [s, e, g] = await Promise.all([tx.get(sRef), tx.get(eRef), tx.get(gRef)]);
    if (!s.exists || s.data()?.userId !== ownerUid || !g.exists
      || g.data()?.ownerUid !== ownerUid || g.data()?.recipientUid !== recipientUid
      || g.data()?.sessionId !== sessionId) throw safeError();
    const next = readEpoch(e.data()) + 1;
    if (!Number.isSafeInteger(next)) throw safeError();
    tx.set(eRef, { shareEpoch: next, ownerUid, sessionId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.update(gRef, { status: "revoked", updatedAt: FieldValue.serverTimestamp() });
    return { revoked: true, sessionId, recipientUid };
  });
  await verifiedActor(request);
  return response;
});
