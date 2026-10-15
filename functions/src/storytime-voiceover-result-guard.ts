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
