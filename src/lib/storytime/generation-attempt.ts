/**
 * Retain one provider-facing request ID for the same exact reviewed input and
 * Firebase User instance. A late response must never cause a second paid
 * admission simply because the user clicks Create again.
 *
 * This is a mounted-page safety fence, not durable cross-device idempotency;
 * the server must still enforce the immutable request binding.
 */
export type StorytimeGenerationAttempt<TActor extends { uid: string }> = {
  actor: TActor;
  reviewFingerprint: string;
  requestId: string;
};

export function bindStorytimeGenerationAttempt<TActor extends { uid: string }>(
  previous: StorytimeGenerationAttempt<TActor> | null,
  actor: TActor,
  reviewFingerprint: string,
  makeRequestId: () => string,
): StorytimeGenerationAttempt<TActor> {
  if (!actor || typeof actor.uid !== "string" || !actor.uid || !reviewFingerprint) {
    throw new Error("A current Storytime actor and reviewed request are required.");
  }
  if (previous && previous.actor === actor && previous.reviewFingerprint === reviewFingerprint) {
    return previous;
  }
  const requestId = makeRequestId();
  if (!/^[A-Za-z0-9._-]{8,128}$/.test(requestId)) {
    throw new Error("A bounded Storytime request ID is required.");
  }
  return { actor, reviewFingerprint, requestId };
}
