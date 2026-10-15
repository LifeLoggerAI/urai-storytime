/** Fail-closed bridge-result checks; independent of Firebase to allow
 * isolated regression tests with synthetic transport envelopes. */
export function confirmedStorytimeOutputDeletion(response: Record<string, unknown>): boolean {
  const deletion = response.deletion;
  return deletion !== null && typeof deletion === "object" && !Array.isArray(deletion)
    && (deletion as Record<string, unknown>).deleted === true;
}

export function hasStorytimeOutputTombstone(record: Record<string, unknown>): boolean {
  return record.status === "output_deleted"
    || (record.outputDeletedAt !== null && record.outputDeletedAt !== undefined);
}

/** Require the exact downstream Jobs identity before local status/cancel writes. */
export function boundStorytimeRemoteJob(response: Record<string, unknown>, expectedJobId: string): Record<string, unknown> | null {
  const value = response.job;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const job = value as Record<string, unknown>;
  if (!expectedJobId || job.jobId !== expectedJobId
    || typeof job.status !== "string" || !job.status.trim() || job.status.length > 64) return null;
  return job;
}

/** A delayed status result cannot reopen cancelled or terminal private output.
 * Authenticated delete-output has its own separately verified tombstone path. */
export function preservedStorytimeTerminalStatus(localJob: Record<string, unknown>, remoteStatus: string): string | null {
  const local = typeof localJob.status === "string" ? localJob.status.toUpperCase() : "";
  const remote = remoteStatus.toUpperCase();
  const successful = new Set(["SUCCESS", "COMPLETED", "DONE"]);
  if (successful.has(local)) return successful.has(remote) ? null : local;
  if (["CANCELLED", "FAILED", "DEAD"].includes(local)) return remote === local ? null : local;
  if (local === "CANCELLATION_REQUESTED" && remote !== "CANCELLED") return local;
  return null;
}
