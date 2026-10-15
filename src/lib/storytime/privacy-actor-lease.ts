/** Capture the exact signed-in User object and auth notification generation.
 * A matching UID alone cannot authorize an old asynchronous privacy result. */
export type StorytimePrivacyActor = { uid: string; emailVerified: boolean }
export type StorytimePrivacyActorLease = { isCurrent(): boolean }

export function captureStorytimePrivacyActorLease<T extends StorytimePrivacyActor>(
  actor: T | null,
  epoch: number,
  readActor: () => T | null,
  readEpoch: () => number,
): StorytimePrivacyActorLease {
  return {
    isCurrent: () => actor !== null && actor.emailVerified === true
      && readActor() === actor && readEpoch() === epoch,
  }
}

export async function awaitCurrentStorytimePrivacyActor<T>(
  lease: StorytimePrivacyActorLease,
  operation: () => Promise<T>,
): Promise<T> {
  if (!lease.isCurrent()) throw new Error('storytime_privacy_actor_changed')
  const result = await operation()
  if (!lease.isCurrent()) throw new Error('storytime_privacy_actor_changed')
  return result
}
