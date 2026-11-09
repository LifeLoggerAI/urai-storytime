/**
 * Server-side, owner-scoped generation admission guard.
 * A missing/legacy guard is not evidence that old paid requests were settled.
 * Only a separately reviewed migration/reconciliation may supply "ready".
 * This guard is a spend concurrency fence, NOT signed original-memory consent.
 */
export type StorytimeAdmissionGuard = {
  schemaVersion?: unknown;
  userId?: unknown;
  state?: unknown;
  activeRequestId?: unknown;
  legacyRequestsReconciled?: unknown;
  providerChargesReconciled?: unknown;
  clearanceReceiptSha256?: unknown;
};

const sha256Pattern = /^[a-f0-9]{64}$/;

export function isClearedStorytimeAdmissionGuard(
  guard: StorytimeAdmissionGuard | null | undefined,
  userId: string
): boolean {
  return !!guard
    && typeof userId === "string"
    && userId.length > 0
    && guard.schemaVersion === "storytime-generation-admission-v1"
    && guard.userId === userId
    && guard.state === "ready"
    && guard.activeRequestId === null
    && guard.legacyRequestsReconciled === true
    && guard.providerChargesReconciled === true
    && typeof guard.clearanceReceiptSha256 === "string"
    && sha256Pattern.test(guard.clearanceReceiptSha256);
}

export function heldStorytimeAdmissionRecord(
  userId: string,
  requestId: string,
  reviewedRequestSha256: string,
  providerInputSha256: string,
  timestamp: string
) {
  if (!userId || !/^[A-Za-z0-9._-]{8,128}$/.test(requestId)
    || !sha256Pattern.test(reviewedRequestSha256)
    || !sha256Pattern.test(providerInputSha256)
    || !Number.isFinite(Date.parse(timestamp))) {
    throw new Error("Storytime generation admission requires verified source identity.");
  }
  return {
    schemaVersion: "storytime-generation-admission-v1" as const,
    userId,
    state: "held" as const,
    activeRequestId: requestId,
    reviewedRequestSha256,
    providerInputSha256,
    legacyRequestsReconciled: false,
    providerChargesReconciled: false,
    clearanceReceiptSha256: null,
    lockedAt: timestamp,
    updatedAt: timestamp
  };
}
