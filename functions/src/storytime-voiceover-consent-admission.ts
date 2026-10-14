import type { Firestore } from "firebase-admin/firestore";

export class StorytimeVoiceoverAdmissionDenied extends Error {
  constructor() {
    super("storytime_voiceover_current_consent_required");
  }
}

export type StorytimeVoiceoverAdmission = {
  userId: string;
  sessionId: string;
  narratorScriptId: string;
  consentReceiptId: string;
  policyVersion: string;
  sourceConsentVersion: string | null;
  narratorText: string;
  createdAt: string;
  idempotencyKey: string;
  requestFingerprint: string;
};

export type StorytimeVoiceoverCompletion = StorytimeVoiceoverAdmission & {
  externalJobId: string;
  provider: "google" | "elevenlabs";
  updatedAt: string;
};

type Snapshot = { exists: boolean; data: () => Record<string, any> | undefined };
const intentRef = (db: Firestore, key: string) => db.collection("storytimeVoiceoverDispatchIntents").doc(key);
const dispatchIdentityValid = (input: StorytimeVoiceoverAdmission) =>
  /^[A-Za-z0-9_-]{8,128}$/.test(input.idempotencyKey)
  && /^[a-f0-9]{64}$/.test(input.requestFingerprint)
  && /^[^/]{1,300}$/.test(input.consentReceiptId)
  && /^[^/]{1,300}$/.test(input.userId)
  && /^[^/]{1,300}$/.test(input.sessionId)
  && /^[^/]{1,300}$/.test(input.narratorScriptId);

function requireCurrentSource(sessionSnapshot: Snapshot, scriptSnapshot: Snapshot, input: StorytimeVoiceoverAdmission) {
  const session = sessionSnapshot.data() || {}, script = scriptSnapshot.data() || {};
  if (!sessionSnapshot.exists || session.userId !== input.userId
    || session.consentSnapshot?.voiceover !== true
    || (session.consentSnapshot?.consentVersion ?? null) !== input.sourceConsentVersion
    || session.safetyStatus !== "approved"
    || session.deleted === true || session.retired === true || session.revoked === true
    || !scriptSnapshot.exists || script.userId !== input.userId
    || script.sessionId !== input.sessionId || script.deleted === true
    || script.retired === true || script.revoked === true
    || typeof script.text !== "string"
    || script.text.trim() !== input.narratorText || !input.narratorText) {
    throw new StorytimeVoiceoverAdmissionDenied();
  }
}

function requireMatchingReceipt(snapshot: Snapshot, input: StorytimeVoiceoverAdmission) {
  const receipt = snapshot.data() || {};
  if (!snapshot.exists
    || receipt.schemaVersion !== "storytime-consent-decision-receipt-v1"
    || receipt.id !== input.consentReceiptId || receipt.userId !== input.userId
    || receipt.purpose !== "storytime.voiceover"
    || receipt.policyVersion !== input.policyVersion
    || receipt.decision !== "authorized"
    || receipt.sourceSessionId !== input.sessionId
    || receipt.narratorScriptId !== input.narratorScriptId
    || (receipt.sourceConsentVersion ?? null) !== input.sourceConsentVersion) {
    throw new StorytimeVoiceoverAdmissionDenied();
  }
}

function requireMatchingIntent(snapshot: Snapshot, input: StorytimeVoiceoverAdmission) {
  const record = snapshot.data() || {};
  if (!snapshot.exists
    || record.schemaVersion !== "storytime-voiceover-dispatch-v1"
    || record.id !== input.idempotencyKey || record.userId !== input.userId
    || record.sessionId !== input.sessionId || record.narratorScriptId !== input.narratorScriptId
    || record.consentReceiptId !== input.consentReceiptId
    || record.policyVersion !== input.policyVersion
    || (record.sourceConsentVersion ?? null) !== input.sourceConsentVersion
    || record.requestFingerprint !== input.requestFingerprint
    || !["pending_dispatch", "reconciliation_required", "queued"].includes(record.state)) {
    throw new StorytimeVoiceoverAdmissionDenied();
  }
  return record;
}

/** Local Firestore transaction commits both source authority and a recoverable
 * dispatch intent before remote Jobs admission. No cross-service atomicity. */
export async function stageStorytimeVoiceoverConsent(db: Firestore, input: StorytimeVoiceoverAdmission): Promise<{ reused: boolean }> {
  if (!dispatchIdentityValid(input)) throw new StorytimeVoiceoverAdmissionDenied();
  const sessionRef = db.collection("storySessions").doc(input.sessionId);
  const scriptRef = db.collection("narratorScripts").doc(input.narratorScriptId);
  const receiptRef = db.collection("consentDecisionReceipts").doc(input.consentReceiptId);
  const outboxRef = intentRef(db, input.idempotencyKey);

  return db.runTransaction(async transaction => {
    const [sessionSnapshot, scriptSnapshot, receiptSnapshot, outboxSnapshot] = await Promise.all([
      transaction.get(sessionRef), transaction.get(scriptRef), transaction.get(receiptRef),
      transaction.get(outboxRef),
    ]);
    requireCurrentSource(sessionSnapshot, scriptSnapshot, input);
    if (receiptSnapshot.exists) requireMatchingReceipt(receiptSnapshot, input);
    if (outboxSnapshot.exists) requireMatchingIntent(outboxSnapshot, input);

    if (!receiptSnapshot.exists) {
      transaction.create(receiptRef, {
        schemaVersion: "storytime-consent-decision-receipt-v1",
        id: input.consentReceiptId,
        userId: input.userId,
        purpose: "storytime.voiceover",
        policyVersion: input.policyVersion,
        decision: "authorized",
        sourceSessionId: input.sessionId,
        narratorScriptId: input.narratorScriptId,
        sourceConsentVersion: input.sourceConsentVersion,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      });
    }
    if (!outboxSnapshot.exists) {
      transaction.create(outboxRef, {
        schemaVersion: "storytime-voiceover-dispatch-v1",
        id: input.idempotencyKey,
        userId: input.userId,
        sessionId: input.sessionId,
        narratorScriptId: input.narratorScriptId,
        consentReceiptId: input.consentReceiptId,
        policyVersion: input.policyVersion,
        sourceConsentVersion: input.sourceConsentVersion,
        requestFingerprint: input.requestFingerprint,
        state: "pending_dispatch",
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      });
    }
    return { reused: receiptSnapshot.exists && outboxSnapshot.exists };
  });
}

/** Complete remote Jobs identity and local Storytime job/export/event binding in
 * one local transaction. Concurrent retries reuse the same durable documents,
 * including the deterministic timeline event. Source and receipt are reread. */
export async function completeStorytimeVoiceoverDispatch(
  db: Firestore, input: StorytimeVoiceoverCompletion
): Promise<{ reused: boolean; voiceoverJobId: string; exportId: string }> {
  if (!dispatchIdentityValid(input) || !/^[^/]{1,300}$/.test(input.externalJobId)
    || !["google", "elevenlabs"].includes(input.provider)) {
    throw new StorytimeVoiceoverAdmissionDenied();
  }
  const voiceoverJobId = "voiceoverJob_" + input.externalJobId;
  const exportId = "storyExport_" + input.externalJobId;
  const eventId = "timelineReplayEvent_" + input.idempotencyKey;
  const sessionRef = db.collection("storySessions").doc(input.sessionId);
  const scriptRef = db.collection("narratorScripts").doc(input.narratorScriptId);
  const receiptRef = db.collection("consentDecisionReceipts").doc(input.consentReceiptId);
  const outboxRef = intentRef(db, input.idempotencyKey);
  const jobRef = db.collection("voiceoverJobs").doc(voiceoverJobId);
  const exportRef = db.collection("storyExports").doc(exportId);
  const eventRef = db.collection("timelineReplayEvents").doc(eventId);

  return db.runTransaction(async transaction => {
    const [sessionSnapshot, scriptSnapshot, receiptSnapshot, outboxSnapshot,
      jobSnapshot, exportSnapshot, eventSnapshot] = await Promise.all([
        transaction.get(sessionRef), transaction.get(scriptRef), transaction.get(receiptRef),
        transaction.get(outboxRef), transaction.get(jobRef),
        transaction.get(exportRef), transaction.get(eventRef),
      ]);
    requireCurrentSource(sessionSnapshot, scriptSnapshot, input);
    requireMatchingReceipt(receiptSnapshot, input);
    const outbox = requireMatchingIntent(outboxSnapshot, input);
    if (outbox.externalJobId && outbox.externalJobId !== input.externalJobId) {
      throw new StorytimeVoiceoverAdmissionDenied();
    }
    const job = jobSnapshot.data() || {}, exported = exportSnapshot.data() || {};
    if (jobSnapshot.exists && (job.userId !== input.userId
      || job.sessionId !== input.sessionId || job.narratorScriptId !== input.narratorScriptId
      || job.externalJobId !== input.externalJobId || job.consentReceiptId !== input.consentReceiptId)) {
      throw new StorytimeVoiceoverAdmissionDenied();
    }
    if (exportSnapshot.exists && (exported.userId !== input.userId
      || exported.sessionId !== input.sessionId || exported.voiceoverJobId !== voiceoverJobId
      || exported.externalJobId !== input.externalJobId)) {
      throw new StorytimeVoiceoverAdmissionDenied();
    }
    const event = eventSnapshot.data() || {};
    if (eventSnapshot.exists && (event.userId !== input.userId
      || event.voiceoverJobId !== voiceoverJobId || event.externalJobId !== input.externalJobId)) {
      throw new StorytimeVoiceoverAdmissionDenied();
    }
    if (!jobSnapshot.exists) {
      transaction.create(jobRef, {
        id: voiceoverJobId, userId: input.userId, sessionId: input.sessionId,
        narratorScriptId: input.narratorScriptId, provider: input.provider,
        externalSystem: "urai-jobs", externalJobId: input.externalJobId,
        consentReceiptId: input.consentReceiptId, status: "queued",
        createdAt: input.createdAt, updatedAt: input.updatedAt,
      });
    }
    if (!exportSnapshot.exists) {
      transaction.create(exportRef, {
        id: exportId, userId: input.userId, sessionId: input.sessionId,
        voiceoverJobId, externalJobId: input.externalJobId,
        exportType: "voiceover", status: "queued", private: true,
        createdAt: input.createdAt, updatedAt: input.updatedAt,
      });
    }
    if (!eventSnapshot.exists) {
      transaction.create(eventRef, {
        id: eventId, userId: input.userId, sessionId: input.sessionId,
        eventType: "voiceover_queued", voiceoverJobId,
        externalJobId: input.externalJobId, createdAt: input.createdAt,
      });
    }
    if (outbox.state !== "queued") {
      transaction.update(outboxRef, {
        state: "queued", externalJobId: input.externalJobId,
        voiceoverJobId, exportId, updatedAt: input.updatedAt,
      });
    }
    return { reused: jobSnapshot.exists && exportSnapshot.exists && eventSnapshot.exists,
      voiceoverJobId, exportId };
  });
}

/** Preserve failure and returned remote ID even when local materialization
 * cannot complete. Retrying prepareVoiceoverJob uses the identical key and
 * payload, while a cancelled/revoked intent requires explicit reconciliation. */
export async function markStorytimeVoiceoverDispatchUncertain(
  db: Firestore, input: StorytimeVoiceoverAdmission,
  options: { externalJobId?: string; state: "reconciliation_required" | "cancel_required" | "cancel_requested"; updatedAt: string }
): Promise<void> {
  if (!dispatchIdentityValid(input)) throw new StorytimeVoiceoverAdmissionDenied();
  const ref = intentRef(db, input.idempotencyKey);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const record = snapshot.data() || {};
    if (!snapshot.exists || record.userId !== input.userId
      || record.requestFingerprint !== input.requestFingerprint
      || record.consentReceiptId !== input.consentReceiptId) {
      throw new StorytimeVoiceoverAdmissionDenied();
    }
    if (record.state === "queued") return;
    if (record.externalJobId && options.externalJobId
      && record.externalJobId !== options.externalJobId) {
      throw new StorytimeVoiceoverAdmissionDenied();
    }
    transaction.update(ref, {
      state: options.state,
      externalJobId: options.externalJobId || record.externalJobId || null,
      updatedAt: options.updatedAt,
    });
  });
}
