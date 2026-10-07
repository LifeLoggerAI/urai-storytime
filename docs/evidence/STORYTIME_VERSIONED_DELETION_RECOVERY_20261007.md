# Version-bound Storytime deletion recovery

Source parent: `4e241a026bf49c6d6b160d8b7e5aff6e06a8dd41`, the existing PR #83 owner. This bounded donor preserves that owner's export, provider, provenance and independent release gates. It does not merge main, authorize a release, accept security risk or deploy.

## Proven source gaps

The predecessor deleted `storySessions` before its child batches. An interruption then left `retry_required`, but another execution rebuilt a complete plan requiring the deleted parent and the original complete target hash. Account cleanup similarly changed its own target inventory before Storage, Auth or receipt failure. The approved remaining work could not resume. The legal-hold query inspected only the first 25 records for each subject key. Planner persistence and stale mutation/failure updates also allowed request cancellation or source replacement to lose races.

The new recovery fixture runs the actual handler body with synthetic SDK boundaries and genuine SDK Timestamp values. On the exact predecessor blob `cbf57ad455bf1fc0d6aa73b3a2c38b05abdef85f`, 27 of 32 new cases fail. Some negative recovery cases fail because the predecessor cannot reach recovery; this count does not imply 27 independently exploitable failures. Positive recovery, late legal-hold, cancellation and conditional mutation cases separately reproduce the concrete gaps.

## Implemented behavior

New deletion plans use `storytime-deletion-plan-v2`. Their approved hash includes canonical confirmed request identity, each selected document's exact Firestore updateTime, each selected Storage generation and the account creation identity where applicable. Planning verifies the live source inventory before storing these versions and rechecks request authority transactionally before publishing `plan_ready`.

Admin execution reserves an exact-plan attempt with a ten-minute lease. An active attempt cannot be replaced by a concurrent plan or competing executor. A failed attempt or expired exact-plan lease can resume only originally approved, unchanged residual targets. This includes original moderation/share targets whose discovery depended on already deleted parent metadata. New records, corrections, same-ID rewrites, foreign recreated parents, replacement Storage generations and changed Auth identities require a new governed plan; they are never silently admitted.

Every Firestore mutation transaction rechecks current request/attempt authority, paginated legal holds and account isolation/family prerequisites, reads exact target versions and deletes with lastUpdateTime preconditions. Storage deletes select the approved generation and use ifGenerationMatch. Storage/Auth calls are preceded by fresh authority checks. These separate services are not one atomic transaction: returned bytes cannot be recalled, Auth has no conditional-delete API, and post-check revocation races remain a distributed-system boundary requiring runtime acceptance. Failure and completion updates are attempt-bound; cancellation or a successor plan wins.

Legal-hold lookup paginates both uid and userId records beyond the previous 25-record cutoff and the 400-record query page. Existing retained safety/spend ledgers, family/child review, shared aggregates, provider/media cleanup, isolated-project and backup-certification gates remain fail-closed. Execution still returns verification_required; it does not claim completed deletion. The independent admin verifier and certified backup policy remain required.

Legacy v1 plans remain readable for historical verification. They cannot gain version-bound retry authority by inference; unexecuted legacy plans need a fresh v2 plan, and an already partial legacy plan needs a governed reconciliation because its original versions were never recorded.

## Verification and exact limits

- Strict compilation of the changed handler and unchanged audit-log module passes with TypeScript 5.9.3 and actual firebase-admin 13.10.0/firebase-functions 6.6.0/zod 3.25.76 APIs. These core versions equal the current Functions lock. The local reused dependency graph has 19 differing transitive lock records and is not represented as a complete frozen Storytime install.
- 50 source-handler/retained contract cases pass with no skips, including 32 new recovery cases and a 1,001-private-version scope across successful and failed 400-record transactions.
- The 44 whole-handler cases also pass against strict emitted JavaScript, alongside six unchanged owner/export routine checks (50 total in the second run). Fixtures are synthetic SDK boundary tests; they do not load a Functions emulator or certify production.
- Existing private-version assertions and all owner-only retained-ledger assertions remain. Ledger tests now execute the whole handler rather than a text-sliced fragment.
- The existing exact-head Functions CI job now runs the 44 relevant whole-handler cases against its actual frozen build, retaining the compiled recovery log with its source-bound artifact. Root CI still runs the full source suite.

Actual loaded Functions, real Auth/Storage/Firestore race acceptance, full current native CI, independent review, backup certification, deployment and production readback remain unclaimed. No real private source, provider call, destructive production mutation or paid generation was used in these fixtures.
