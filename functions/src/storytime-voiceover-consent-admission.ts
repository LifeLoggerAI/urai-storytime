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
};

/** Commit source authority before any remote narrator queue request.
 * This is a local Firestore transaction, not a cross-service atomic commit. */
export async function stageStorytimeVoiceoverConsent(db: Firestore, input: StorytimeVoiceoverAdmission): Promise<{ reused: boolean }> {
  const sessionRef = db.collection("storySessions").doc(input.sessionId);
  const scriptRef = db.collection("narratorScripts").doc(input.narratorScriptId);
  const receiptRef = db.collection("consentDecisionReceipts").doc(input.consentReceiptId);
  return db.runTransaction(async transaction => {
    const [sessionSnapshot, scriptSnapshot, receiptSnapshot] = await Promise.all([
      transaction.get(sessionRef), transaction.get(scriptRef), transaction.get(receiptRef),
    ]);
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
    if (receiptSnapshot.exists) {
      const receipt = receiptSnapshot.data() || {};
      // Never re-authorize a previously revoked or mismatched deterministic receipt.
      if (receipt.schemaVersion !== "storytime-consent-decision-receipt-v1"
        || receipt.id !== input.consentReceiptId || receipt.userId !== input.userId
        || receipt.purpose !== "storytime.voiceover"
        || receipt.policyVersion !== input.policyVersion
        || receipt.decision !== "authorized"
        || receipt.sourceSessionId !== input.sessionId
        || receipt.narratorScriptId !== input.narratorScriptId
        || (receipt.sourceConsentVersion ?? null) !== input.sourceConsentVersion) {
        throw new StorytimeVoiceoverAdmissionDenied();
      }
      return { reused: true };
    }
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
      createdAt: input.createdAt, updatedAt: input.createdAt,
    });
    return { reused: false };
  });
}
