/** Bind a private read to the exact Firebase User instance and auth event generation.
 * UID equality is insufficient: a recreated/signed-out-and-signed-in account may
 * reuse the same UID while the earlier pending read belongs to the old session. */
export type StorytimeAccount = { uid: string };
export type StorytimeAccountLease = { isCurrent(): boolean };

export function captureStorytimeAccountLease<T extends StorytimeAccount>(
  actor: T | null,
  epoch: number,
  readActor: () => T | null,
  readEpoch: () => number,
): StorytimeAccountLease {
  return {
    isCurrent: () => actor !== null
      && readActor() === actor
      && readEpoch() === epoch,
  };
}
