# Storytime revision transaction boundary

This source repair is stacked above dependency owner PR #83 at `49857678162d895f3a41b537496bdb84c9b263f3`. It does not authorize deployment, provider generation, deletion, independent review or production acceptance.

Edit and restore now read the canonical owner session, expected current version, immutable current version and every writable child record in the same Firestore transaction that creates the successor version and updates the current session. Version numbers must be safe positive integers with room for a successor, and the session number must equal its referenced immutable version number. Chapter, moment and narrator records must still exist and match both owner and session. A stale contender retries against current authority and aborts instead of overwriting an accepted successor. Deleted or reassigned records cannot be recreated by a revision.

Each invocation allocates one version ID outside the transaction and creates it with a non-overwrite precondition. The immutable source/target history remains unchanged. Editing and restoring stay provider-free and retain existing safety text checks and verified-account requirements.

History now requests a descending `versionNumber` ordering and a 25-record limit from Firestore. The corresponding owner/session/version index is included. The protected deployment owner must admit that index before enabling the changed query in the deployed runtime.

Validation: all ten new actual-callable fixtures fail against the prior source; all ten pass after repair. Fixtures execute the source with synthetic SDK dependencies and an optimistic transaction conflict model, covering edit/edit and edit/restore contention, foreign chapter/moment/narrator references, session deletion, ownership changes during commit, restore ownership, invalid or inconsistent counters, and bounded history reads. Full local root suite passes 202 tests with no failures/skips; app typecheck/build, Functions build and full app/Functions dependency audits pass, each audit reporting zero total vulnerabilities. Local Node24 is supplemental to declared FunctionsNode22; fresh native exact-head CI remains required.

These fixtures do not certify genuine Firestore contention, emulator-loaded Functions, protected staging, distributed deletion/revocation fences, provider copies, backups or production. The wider Storytime deletion executor still requires its separate privacy lifecycle and protected runtime gates. This repair proves only the bounded revision transaction and query source behavior.
