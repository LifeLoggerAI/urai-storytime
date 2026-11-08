/** A request ID is an immutable binding to an owner's exact reviewed source and
 * provider payload. It is not authority to return some other story on a retry. */
export type StorytimeGenerationBinding = {
  reviewedRequestSha256?: unknown;
  providerInputSha256?: unknown;
};

export type StorytimeReusableSession = {
  userId?: unknown;
  requestId?: unknown;
  status?: unknown;
  safetyStatus?: unknown;
  revoked?: unknown;
  requestReview?: { processedRequestSha256?: unknown } | null;
  provenance?: { factualStatus?: unknown } | null;
};

const sha256Pattern = /^[0-9a-f]{64}$/;

export function sameStorytimeGenerationBinding(
  stored: StorytimeGenerationBinding,
  current: { reviewedRequestSha256: string; providerInputSha256: string }
): boolean {
  return typeof stored.reviewedRequestSha256 === "string"
    && typeof stored.providerInputSha256 === "string"
    && sha256Pattern.test(stored.reviewedRequestSha256)
    && sha256Pattern.test(stored.providerInputSha256)
    && stored.reviewedRequestSha256 === current.reviewedRequestSha256
    && stored.providerInputSha256 === current.providerInputSha256;
}

export function isValidStorytimeSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);
}

export function isReusableStorytimeSession(
  stored: StorytimeReusableSession | null | undefined,
  ownerUid: string,
  requestId: string,
  reviewedRequestSha256: string
): boolean {
  return !!stored
    && sha256Pattern.test(reviewedRequestSha256)
    && stored.userId === ownerUid
    && stored.requestId === requestId
    && stored.status === "ready"
    && stored.safetyStatus === "approved"
    && stored.revoked !== true
    && stored.requestReview?.processedRequestSha256 === reviewedRequestSha256
    && stored.provenance?.factualStatus === "creative_derivative_not_source_evidence";
}
