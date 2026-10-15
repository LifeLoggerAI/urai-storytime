import type { Firestore } from "firebase-admin/firestore";
import { createHash, randomUUID } from "node:crypto";

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
  dispatch: {
    provider: "google" | "elevenlabs";
    locale: string;
    voice: string | null;
    voiceId: string | null;
    textSha256: string;
  };
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
  && /^[a-f0-9]{64}$/.test(input.dispatch?.textSha256 || "")
  && ["google", "elevenlabs"].includes(input.dispatch?.provider || "")
  && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(input.dispatch?.locale || "")
  && (input.dispatch?.voice === null || typeof input.dispatch?.voice === "string")
  && (input.dispatch?.voiceId === null || typeof input.dispatch?.voiceId === "string")
  && createHash("sha256").update(input.narratorText).digest("hex") === input.dispatch.textSha256
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
    || !["pending_dispatch", "reconciliation_required", "queued", "dispatching", "cancel_required", "cancelling"].includes(record.state)
    || JSON.stringify(record.dispatch) !== JSON.stringify(input.dispatch)) {
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
        dispatch: input.dispatch,
        state: "pending_dispatch",
        attemptCount: 0,
        nextAttemptAt: input.createdAt,
        lastErrorCode: null,
        leaseToken: null,
        leaseExpiresAt: null,
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
        leaseToken: null, leaseExpiresAt: null, nextAttemptAt: null,
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


/** Recovery is deliberately bounded. Source/receipt checks are made in the
 * claim transaction; remote requests use the identical governed idempotency
 * key, and their results are materialized by the existing fenced transaction.
 * Runtime scheduling is separate so these transitions are emulator-testable. */
export const STORYTIME_VOICEOVER_RECOVERY_MAX_ATTEMPTS = 5;
const RECOVERY_LEASE_MS = 120_000;
export type NarratorBridge = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
export type NarratorRecoveryResult = "queued" | "cancelled" | "retry" | "needs_review" | "skipped";

function validUtc(value: unknown): number {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
}
function backoffMillis(attempt: number) {
  return Math.min(60 * 60_000, 60_000 * 2 ** Math.min(5, Math.max(0, attempt - 1)));
}

/** Ownership lease, current session, script and decision receipt are read
 * atomically. A stale lease can be recovered, but a live lease cannot be stolen.
 * No external side effects occur within this Firestore transaction. */
export async function claimStorytimeVoiceoverRecovery(
  db: Firestore, key: string, clockMs: number, workerId: string
): Promise<null | { token: string; operation: "dispatch" | "materialize" | "cancel";
  admission: StorytimeVoiceoverAdmission; externalJobId: string | null; attemptCount: number }> {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(key) || !workerId || !Number.isFinite(clockMs)) return null;
  const ref = intentRef(db, key);
  return db.runTransaction(async transaction => {
    const initial = await transaction.get(ref);
    if (!initial.exists) return null;
    const value = initial.data() || {};
    if (!["pending_dispatch", "reconciliation_required", "dispatching",
      "cancel_required", "cancelling", "cancel_requested"].includes(value.state)) return null;
    if (validUtc(value.nextAttemptAt) > clockMs) return null;
    if (value.leaseToken && validUtc(value.leaseExpiresAt) > clockMs) return null;
    const attempts = Number.isSafeInteger(value.attemptCount) && value.attemptCount >= 0
      ? value.attemptCount : 0;
    if (attempts >= STORYTIME_VOICEOVER_RECOVERY_MAX_ATTEMPTS) {
      transaction.update(ref, { state: "operator_reconciliation_required",
        lastErrorCode: "retry_limit_reached", leaseToken: null,
        leaseExpiresAt: null, nextAttemptAt: null,
        updatedAt: new Date(clockMs).toISOString() });
      return null;
    }
    const sessionRef = db.collection("storySessions").doc(String(value.sessionId || ""));
    const scriptRef = db.collection("narratorScripts").doc(String(value.narratorScriptId || ""));
    const receiptRef = db.collection("consentDecisionReceipts").doc(String(value.consentReceiptId || ""));
    const [session, script, receipt] = await Promise.all([
      transaction.get(sessionRef), transaction.get(scriptRef), transaction.get(receiptRef)
    ]);
    const scriptText = String(script.data()?.text || "").trim();
    const admission: StorytimeVoiceoverAdmission = {
      userId: String(value.userId || ""), sessionId: String(value.sessionId || ""),
      narratorScriptId: String(value.narratorScriptId || ""),
      consentReceiptId: String(value.consentReceiptId || ""),
      policyVersion: String(value.policyVersion || ""),
      sourceConsentVersion: typeof value.sourceConsentVersion === "string" ? value.sourceConsentVersion : null,
      narratorText: scriptText, createdAt: String(value.createdAt || ""),
      idempotencyKey: key, requestFingerprint: String(value.requestFingerprint || ""),
      dispatch: value.dispatch,
    };
    let valid = false;
    try {
      if (dispatchIdentityValid(admission)) {
        requireCurrentSource(session, script, admission);
        requireMatchingReceipt(receipt, admission);
        requireMatchingIntent(initial, admission);
        valid = true;
      }
    } catch { /* do not reveal private source or receipt mismatch */ }
    const remoteId = typeof value.externalJobId === "string" && /^[A-Za-z0-9_-]{10,64}$/.test(value.externalJobId)
      ? value.externalJobId : null;
    if (!valid && !remoteId) {
      // Unknown remote ID might have been committed before network timeout.
      // Never replay create under revoked or ambiguous authorization.
      transaction.update(ref, { state: "operator_reconciliation_required",
        lastErrorCode: "source_authority_unavailable_remote_identity_unknown",
        leaseToken: null, leaseExpiresAt: null, nextAttemptAt: null,
        updatedAt: new Date(clockMs).toISOString() });
      return null;
    }
    const token = randomUUID();
    const operation = !valid || ["cancel_required", "cancelling", "cancel_requested"].includes(value.state)
      ? "cancel" : remoteId ? "materialize" : "dispatch";
    transaction.update(ref, { state: operation === "cancel" ? "cancelling" : "dispatching",
      leaseToken: token, leaseOwner: workerId, leaseExpiresAt: new Date(clockMs + RECOVERY_LEASE_MS).toISOString(),
      attemptCount: attempts + 1, updatedAt: new Date(clockMs).toISOString() });
    return { token, operation, admission, externalJobId: remoteId, attemptCount: attempts + 1 };
  });
}

/** A runner must not overwrite a newer lease or silently extend retries.
 * Caller-supplied error codes are a closed non-sensitive enumeration. */
export async function settleStorytimeVoiceoverRecovery(
  db: Firestore, key: string, token: string, clockMs: number,
  state: "reconciliation_required" | "cancel_required" | "cancelled" | "operator_reconciliation_required",
  errorCode: "bridge_unavailable" | "local_materialization_failed" |
    "cancellation_unconfirmed" | "source_authority_unavailable_remote_identity_unknown" | "retry_limit_reached",
  externalJobId?: string
): Promise<boolean> {
  const ref = intentRef(db, key);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref), current = snap.data() || {};
    if (!snap.exists || current.leaseToken !== token) return false;
    if (current.externalJobId && externalJobId && current.externalJobId !== externalJobId) {
      throw new StorytimeVoiceoverAdmissionDenied();
    }
    const attempt = Number.isSafeInteger(current.attemptCount) ? current.attemptCount : 1;
    const terminal = state === "cancelled" || state === "operator_reconciliation_required" ||
      attempt >= STORYTIME_VOICEOVER_RECOVERY_MAX_ATTEMPTS;
    tx.update(ref, {
      state: terminal && state !== "cancelled" ? "operator_reconciliation_required" : state,
      lastErrorCode: terminal && state !== "cancelled" && attempt >= STORYTIME_VOICEOVER_RECOVERY_MAX_ATTEMPTS
        ? "retry_limit_reached" : errorCode,
      externalJobId: externalJobId || current.externalJobId || null,
      leaseToken: null, leaseExpiresAt: null, updatedAt: new Date(clockMs).toISOString(),
      nextAttemptAt: terminal ? null : new Date(clockMs + backoffMillis(attempt)).toISOString(),
    });
    return true;
  });
}

/** Recover one outbox entry. Synthetic call adapters can inject network and
 * storage failures; a real scheduled runner injects the existing Jobs bridge.
 * No user content is included in recovery logs or return values. */
export async function recoverStorytimeVoiceoverIntent(
  db: Firestore, key: string, bridge: NarratorBridge, clockMs = Date.now(), workerId = "storytime-recovery"
): Promise<NarratorRecoveryResult> {
  const claim = await claimStorytimeVoiceoverRecovery(db, key, clockMs, workerId);
  if (!claim) return "skipped";
  const { token, admission, operation } = claim;
  let remoteId = claim.externalJobId || undefined;
  const identity = { userId: admission.userId, sessionId: admission.sessionId,
    narratorScriptId: admission.narratorScriptId };
  if (operation === "cancel") {
    if (!remoteId) {
      await settleStorytimeVoiceoverRecovery(db, key, token, clockMs,
        "operator_reconciliation_required", "source_authority_unavailable_remote_identity_unknown");
      return "needs_review";
    }
    try {
      const result = await bridge({ action: "cancel", ...identity, jobId: remoteId });
      const status = String((result.job as Record<string, unknown> | undefined)?.status || "");
      if (!["SUCCESS", "CANCELLED", "FAILED", "DEAD"].includes(status)) {
        throw new Error("cancellation_unconfirmed");
      }
      // Every terminal state can retain private output. Completion requires
      // an explicit Jobs deletion receipt, including confirmed absence.
      const deletion = await bridge({ action: "delete-output", ...identity, jobId: remoteId });
      if (!deletion.deletion || typeof deletion.deletion !== "object" ||
        (deletion.deletion as Record<string, unknown>).deleted !== true) {
        throw new Error("unconfirmed_audio_deletion");
      }
      await settleStorytimeVoiceoverRecovery(db, key, token, clockMs,
        "cancelled", "cancellation_unconfirmed", remoteId);
      return "cancelled";
    } catch {
      await settleStorytimeVoiceoverRecovery(db, key, token, clockMs,
        "cancel_required", "cancellation_unconfirmed", remoteId);
      return "retry";
    }
  }
  try {
    if (!remoteId) {
      // Recheck current authority after leasing and immediately before remote
      // dispatch; the lease alone never grants permission to create new work.
      await stageStorytimeVoiceoverConsent(db, admission);
      const d = admission.dispatch;
      const created = await bridge({
        action: "create", ...identity, idempotencyKey: admission.idempotencyKey,
        consent: { purpose: "storytime.voiceover", policyVersion: admission.policyVersion,
          decisionReceiptId: admission.consentReceiptId },
        payload: { text: admission.narratorText, locale: d.locale, provider: d.provider,
          ...(d.voice ? { voice: d.voice } : {}),
          ...(d.voiceId ? { voiceId: d.voiceId } : {}), format: "MP3" }
      });
      if (typeof created.jobId !== "string" || !/^[A-Za-z0-9_-]{10,64}$/.test(created.jobId)) {
        throw new Error("bridge_job_identity_unavailable");
      }
      remoteId = created.jobId;
    }
    await completeStorytimeVoiceoverDispatch(db, {
      ...admission, externalJobId: remoteId,
      provider: admission.dispatch.provider, updatedAt: new Date(clockMs).toISOString(),
    });
    return "queued";
  } catch (error) {
    if (error instanceof StorytimeVoiceoverAdmissionDenied) {
      await settleStorytimeVoiceoverRecovery(db, key, token, clockMs,
        remoteId ? "cancel_required" : "operator_reconciliation_required",
        "source_authority_unavailable_remote_identity_unknown", remoteId);
      return remoteId ? "retry" : "needs_review";
    }
    await settleStorytimeVoiceoverRecovery(db, key, token, clockMs,
      "reconciliation_required", remoteId ? "local_materialization_failed" : "bridge_unavailable", remoteId);
    return "retry";
  }
}

/** Bounded scheduler pass with deterministic scan and per-document leases.
 * Never exposes source text, provider content or personal identifiers in logs. */
export async function scanStorytimeVoiceoverRecovery(
  db: Firestore, bridge: NarratorBridge, clockMs = Date.now(), workerId = randomUUID()
): Promise<{ checked: number; queued: number; cancelled: number; retried: number; review: number }> {
  const states = ["pending_dispatch", "reconciliation_required", "dispatching",
    "cancel_required", "cancelling", "cancel_requested"];
  // Query only due work *before* the bounded limit. Otherwise forty
  // future-dated attempts can permanently starve an eligible later intent.
  // The matching composite index is declared in firestore.indexes.json.
  const docs = await db.collection("storytimeVoiceoverDispatchIntents")
    .where("state", "in", states)
    .where("nextAttemptAt", "<=", new Date(clockMs).toISOString())
    .orderBy("nextAttemptAt", "asc")
    .limit(40).get();
  const output = { checked: 0, queued: 0, cancelled: 0, retried: 0, review: 0 };
  for (const snap of docs.docs) {
    output.checked++;
    const result = await recoverStorytimeVoiceoverIntent(db, snap.id, bridge, clockMs, workerId);
    if (result === "queued") output.queued++;
    if (result === "cancelled") output.cancelled++;
    if (result === "retry") output.retried++;
    if (result === "needs_review") output.review++;
  }
  return output;
}
