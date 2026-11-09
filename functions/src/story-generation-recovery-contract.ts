/**
 * Owner-visible read-only generation receipts. This is status evidence, not
 * recorded-memory provenance, payment settlement, or permission to retry.
 *
 * Do not add story text, source hashes, consent snapshots or provider receipts
 * to this returned shape. The backend separately verifies the owned session.
 */
export type StorytimeRecoveryState =
  | "ready"
  | "processing"
  | "cancellation_requested"
  | "cancelled"
  | "requires_review";

export type StorytimeRecoveryReceipt = {
  requestId: string;
  state: StorytimeRecoveryState;
  sessionId: string | null;
  updatedAt: string | null;
  retryAuthorized: false;
};

const requestIdPattern = /^[A-Za-z0-9._-]{8,128}$/;
const sessionIdPattern = /^[A-Za-z0-9_-]{8,128}$/;

export function sanitizeStorytimeRecoveryReceipt(
  record: Record<string, unknown> | null | undefined,
  ownerUid: string,
  verifiedOwnedSessionId: string | null = null,
): StorytimeRecoveryReceipt | null {
  if (!record || !ownerUid || record.userId !== ownerUid
    || typeof record.requestId !== "string"
    || !requestIdPattern.test(record.requestId)) return null;

  // A server-side verified session is required before any ready link is shown.
  const ready = record.status === "succeeded"
    && record.cancellationRequested !== true
    && typeof record.sessionId === "string"
    && sessionIdPattern.test(record.sessionId)
    && record.sessionId === verifiedOwnedSessionId;

  let state: StorytimeRecoveryState = "requires_review";
  if (ready) state = "ready";
  else if (record.status === "cancelled") state = "cancelled";
  else if (record.status === "cancellation_requested" || record.cancellationRequested === true) state = "cancellation_requested";
  else if (record.status === "processing") state = "processing";

  const updatedAt = typeof record.updatedAt === "string"
    && record.updatedAt.length <= 48
    && Number.isFinite(Date.parse(record.updatedAt))
      ? record.updatedAt
      : null;

  return {
    requestId: record.requestId,
    state,
    sessionId: ready ? verifiedOwnedSessionId : null,
    updatedAt,
    retryAuthorized: false,
  };
}
