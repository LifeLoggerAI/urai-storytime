# R906 — Atomic cancellation protection for local Storytime persistence

**Status:** source correction isolated; exact-run native tests **NOT EXECUTED**; production HOLD. Review date November 8, 2026.

## Exact source and worker ancestry
The review is an independent child of current Storytime draft PR #103 head `57b54044bb6e61713c75ba559166a1128244dc19`, itself an isolated branch of the prior engineering PR #97. No changes to main, PRs #83/#96/#97/#99/#100/#101/#102/#103, production IAM, private memories, or paid provider were made.

## Specific demonstrated source-level race
Before the R906 patch, `generateStorySession` checked `isGenerationCancellationRequested` after generation but **before** output moderation and record construction, and then wrote the deterministic builder's `storySessions`, chapter, moment, scene, script, version and `storyGenerationRequests.status=succeeded` with `db.batch()`. A `cancelStoryGeneration` Firestore transaction racing between the separate read and batch could set `cancellationRequested=true` while the unchecked batch still wrote completed records and a successful claim. This branch exists only when `local_builder` is permitted, which existing source gates to nonproduction; the issue is nonetheless relevant for safe emulator tests and architecture. Paid OpenAI persistence already uses a separate protected `commitPaidOutput(writeStory)` transaction and is intentionally untouched.

## Source correction
- Current `functions/src/storytime.ts` blob `c25e884c38add470f7a8d958c1f711557bf059cd`: replace only the `local_builder` final blind batch with `db.runTransaction`. Read its generation request *inside the same transaction* before writing any story records. Verify UID, request ID, status exactly `processing`, no cancellation/revocation flag, matching previously reviewed SHA-256/source/provider input via `sameStorytimeGenerationBinding`, explicit generation and provider consent, and supported consent version. Firestore optimistic transaction conflict semantics require re-read/retry when cancellation changes the request.
- Reject explicit `cancelled`, `permission-denied` or `failed-precondition` local transaction errors without entering `reconcileStoryPersistence`, so a real cancellation is not rewritten as an ambiguous persistence failure. Genuine unknown commit-result faults still take the existing reconciliation/dead-letter path.
- New regression `tests/e2e/storytime-local-commit-cancellation-fence.test.mjs` blob `3b2e20a84d36c91111a2b86a3d25025fbaed46c8`: five text-level source-contract tests for transaction versus batch, checks before write, correct explicit-denial handling, unchanged paid path, and creative-derivative factual label. This test is authored and committed but **not executed in the project's Node runtime**.
- Static direct GitHub source readback confirms exact final transaction block, no `db.batch()` in the local persistence path, expected original source/provenance constraints, and early explicit-denial rethrow. **Static inspection only**, not a claim of passing Firebase emulator or source test.

## Remaining limits and risk
- Local `git ls-remote` returns `Could not resolve host: github.com`; no full frozen source checkout. GitHub Actions consistently report failure without usable steps; this worker could not run original-source test, npm install, full TypeScript compiler, Next build, Functions build, emulator or browser.
- Firestore admin SDK bypasses Rules; the transaction's caller and privileged service role require separate IAM/owner verification.
- Already dispatched paid OpenAI requests cannot be undone by a local transaction guard; canonical signed Privacy, provider admission/revocation and physical deletion remain P0.
- Authenticated user source submissions and edits are separate from recorded original media/attributed family recollection/AI creative interpretation; this patch does not confer truth/source rights.
- A transaction failure due to a non-cancelled, unexpected storage or auth problem remains subject to reconciliation and independent provider/owner receipt review.

## Required next-worker verification
1. Exact SHA frozen install, TypeScript compile, native Node source tests and Functions build.
2. Four real Firebase emulators with synthetic account A owner, account B denied, cancelled-after-generation before persistence, cancelling concurrently with transaction, revoked consent/source, mismatched source fingerprint, malformed request, no second output and no duplicate provider dispatch.
3. Validate `cancelStoryGeneration` and `claimGenerationRequest` state machine together, including nonproduction fallback and the real paid path's unchanged authority boundary; prove actual transaction conflict retries and no story/chapters/versions leaked when cancellation wins.
4. Independent privacy/security review and owner authority from canonical Privacy; never activate real private memories, paid provider or production just to validate this patch.

**Review decision: draft only, production HOLD.**
