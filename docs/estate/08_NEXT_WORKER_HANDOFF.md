# Storytime 08 — Next-worker continuation

Review-only source forensic reconciliation. main@73f586a0a2931961ae221af7cfc0caf1b6aef39d; unmerged PR #97@312240f5da9042a2cc9d11dac179bed90dee51d1. November 7, 2026. Production HOLD. No private user media inspected.


## Exact baseline and source ownership

Main 73f586a0a2931961ae221af7cfc0caf1b6aef39d. Open owner #83 33ecc480ffe96e83647a29e09969defeb84ca3fd; child #96 31cf72a01b65667de89c9ad565b6f0a4e51759a0; child #97 312240f5da9042a2cc9d11dac179bed90dee51d1; separate starter #98 a0fa8fc773a768de10cdb8b33386f3ce22282d15. Re-fetch all heads before any action.

Start from the present docs/estate/01 through 09, MANIFEST.json, SOURCE_TO_STORY_PROVENANCE_LEDGER.md, OWNER_AUTHORIZATION_MATRIX.md, and private Labs Genesis PR #262 EVIDENCE_STANDARD/WORKER_PROTOCOL. Main 306 paths and engineering #97 355 paths are complete recursive *metadata* listings; not raw SHA-256 or all-branch history audits. Preserve privacy and every concurrent worker branch.

## Next exact safe execution

1. Fetch latest PR and parent heads, compare by immutable SHA/tree/blob with recorded manifests.
2. Obtain actual failed CI logs of #97/#98 through authorized route; previous connector returns BlobNotFound, so error cause remains unknown.
3. Run clean exact-head Node 22 frozen npm ci root+Functions; npm test/typecheck/Next build/Functions compile; true real Firebase Auth/Firestore/Storage/Functions emulator owner-negative matrix and Storytime-Jobs disposal harness. Retain test counts/logs/source/runner identity.
4. Audit current and older private client sessions, Admin SDK and Firestore client mutation trust paths, source consent/revocation and canonical Privacy issuer. Preserve #83 protections and #97 deployment guard while repairing only demonstrated defects.
5. Build synthetic-only source-to-story claim ledger; real owner memory ingestion must remain disabled until source-specific signed consent, third-party access boundary and downstream deletion are independently proven.
6. Verify actual governed Studio/Content/AssetFactory/Jobs/Spatial consumers and protected owner-specific replay; do not turn on provider spend or production just for test coverage.
7. Complete raw Git SHA-256/branch history/binary/LFS/CI artifacts and Drive source mapping as available, and get qualified legal, accessibility, safety and independent release approval.

## Security and story truth

Never turn an attributed family recollection into recorded fact. Never turn a model-generated scene into evidence. Preserve the exact source ID/hash and user corrections, and label unsupported claims unresolved. No protected memory, person likeness, cloned voice, private share or media export unless signed authority and purpose proven.

Final decision remains **production HOLD**.


## New permanent continuation evidence — 96 branch trees
The previous two-tree inventory is **superseded in scope** by `docs/estate/history/BRANCH_TREES_01.json` through `BRANCH_TREES_08.json` and deduplicated `BRANCH_HEAD_AGGREGATE.json`: 96 branch heads, all nontruncated, 4,760 distinct Git blob identities, 66,472,643 Git-reported unique bytes, no raw-byte SHA-256; no checked-in common media types, but no off-Git media inspected. Historical original children's lock and 2024-dated audit are recovered in `history/HISTORICAL_CHILD_STORYTIME_CANON_CONFLICT_20261107.md`; May 11, 2026 is the observed historic branch commit date and must not be relabeled 2024. Key next worker tasks: deduplicate actual unique Git blob bytes and validate SHA-256 where retrievable; traverse all intermediate historical commits; inspect 4,120 dependency-path occurrences separately from original authored code; investigate documented external media with lawful/owner permission; resolve child-locked experience vs later adult narrative-memory consent.


## R900 security repair — independent child of engineering #97
- New draft security PR [#100](https://github.com/LifeLoggerAI/urai-storytime/pull/100), branch `review/chalk-storytime-server-owned-canon-20261107`, based on exact #97 `312240f5da9042a2cc9d11dac179bed90dee51d1`, does NOT change #83/#96/#97/main.
- Source proof: unmerged #97 Firestore Rules previously allowed owner-created and owner-updated generated `storySessions` (any nonmoderation property including consentSnapshot and provenance), other generated derivatives and voiceover/exports, and arbitrary signed-in auditLogs. Existing Rules tests positively expected owner write to story title, and public share tests expected client creation/update. Modern Storytime web UI uses callables for writing these collections. This discrepancy is a concrete source-level authority gap; no production exploitation is asserted.
- Isolated remediation: generated story and derivative/job/export records (13 collections) are client read-only for owner/admin and server-only for writes; auditLogs admin read, client write denied. Updated existing native emulator authorization matrix, public-share test and production-boundaries source assertion, plus full security report at `docs/estate/R900_SERVER_WRITTEN_STORYTIME_CANON_SECURITY_REVIEW_20261107.md` on PR #100.
- Latest Actions failure checks finish within ~3 seconds without runner steps and job logs are inaccessible; specific root cause remains UNKNOWN (runner/account issue suspected, not certified). No new native npm build, Firebase emulator, device or live memory verification passed. **Do not merge #100** until exact-head native tests, CI and independent security approval.
- Additional outstanding P0: admin token can read owner private story content in current Firestore Rules, legacy families allow client member-management updates, and canonical consent source issuer/cross-system memory-graph authorization remain unverified. Do not claim least privilege or signed source permission merely from rule changes.


## R901 exact Storytime ↔ Jobs source verification
Read exact current Storytime #97 narrator source and Jobs current main `functions/src/jobs/storytimeNarratorBridge.ts` blob `cec3a4f6638aa3d646457b08f7c24e99cf4715a3`. New `docs/estate/R901_STORYTIME_JOBS_NARRATOR_CROSS_SYSTEM_AUTHORITY_20261107.md` records full trust/consent/idempotency/output/revocation matrix. Jobs authenticates the server bearer token and accepts a supplied Storytime consent receipt ID, but does not visibly validate that remote Storytime consent receipt's original issuer in its project. Source-controlled voiceover is a derivative script, **not evidence that recorded private memory actually happened**. All four-emulator/staging, token negative, protected audio, revocation and physical cleanup tests remain P0. No external media/API used. PR #100 new rules test review also includes public-share-lifecycle.test.mjs denial updates; do not merge until native checks pass.


## R902 private list account-switch security review and additional form concern

- [Storytime draft PR #101](https://github.com/LifeLoggerAI/urai-storytime/pull/101) is a **separate isolated child of #97** at recorded review head `598c969fe4a258331c442692887903bacadf42fa`. It does not replace #100, #99, or an owner engineering branch. Source: `src/components/storytime/SessionLibrary.tsx` and `DraftLibrary.tsx` previously used `active` only for component unmount, permitting earlier user's pending Firestore `getDocs` result to settle after a new Firebase login. The new code uses exact Firebase User object and auth epoch, clears loading state and performs ready-state current-actor rendering checks, with new pure helper tests; **not yet native-tested**. Security report in #101 `docs/estate/R902_PRIVATE_LIBRARY_AUTH_EPOCH_SECURITY_REVIEW_20261107.md`.
- **Additional uncovered P0:** `StorytimeHome.tsx` draft autosave has a pending `httpsCallable(saveStoryDraft)` that sets draftId/revision/status after await **without a current Firebase actor/epoch recheck**. Moreover when no `?draft=` URL parameter is present, the draft-resume auth effect returns without installing a sign-in listener, so typed form sourceText might remain visible across signout and new login in the same mounted browser. This is a **source-level suspected privacy/UI risk**; needs exact current-head negative browser checks and isolated repair, not a claim of actual production disclosure. Do not silently restore generation/provider consent after any account transition.
- PR #101 Actions Verify/CI/Visual all report failure at source head `598c969fe4a258331c442692887903bacadf42fa`; runner logs not available for a current native test assertion. Maintain HOLD.


## R903 — StorytimeHome exact-actor form, autosave, delete and generation guard

- New isolated **draft [PR #102](https://github.com/LifeLoggerAI/urai-storytime/pull/102)**, `review/chalk-storytime-home-auth-fence-20261107`, child of #101 at `598c969fe4a258331c442692887903bacadf42fa`; initial head `9be92015f1f9b42101e224aedf92807d0777cdcb`. Reuse #101 auth lease rather than duplicating.
- Confirmed source gap from #97: `StorytimeHome.tsx` subscribed to Firebase auth only if URL contained `?draft=`, so plain create-form private memory text could persist across account change; pending save/delete/story generation responses could update new actor UI or navigate after switching. This is **source-level**, not live confirmed exposure.
- Patched exact `StorytimeHome.tsx` blob `4c65137273ec09f39bfffe520bc5cc9018f08bc8`: always-subscribe on cloud-ready form, clear sourceText/consents/ids/review state on auth change, bind form rendering to exact Firebase User object and epoch, gate async autosave status/ID, draft delete and generation navigation after await. Four focused source-contract tests `tests/e2e/storytime-home-auth-fence.test.mjs` blob `595bb6120ee94aca0e0f4cc8ca0a0d3b6a2b3ea1`.
- **9/9 independent static invariants passed. Native test, Node22 Next build, Firebase emulator and two-account browser testing NOT run** (clone DNS blocked and Actions red). Neither source patch nor a test fixture proves authorized processing of real private memories.
- A previously dispatched remote generation is not revoked by a client-side lease: signed canonical Privacy source consent, server replay/deletion fences, provider recovery, IAM and downstream rights remain P0. Full report on PR #102 at `docs/estate/R903_HOME_FORM_AUTH_FENCE_20261107.md`. Keep all three security PRs #100/#101/#102 **draft and unmerged** until exact-head native and owner/other-account negative acceptance; do not flatten branches without review.


## R904 generation retry fingerprint / old owner story integrity

- New **draft PR [#103](https://github.com/LifeLoggerAI/urai-storytime/pull/103)** based on exact #97 `312240f5da9042a2cc9d11dac179bed90dee51d1`, isolated branch `review/chalk-storytime-generation-fingerprint-20261107`. Older owner/worker PRs #83/#96/#97/#99/#100/#101/#102 and main untouched.
- Confirmed source issue in original `functions/src/storytime.ts`: `claimGenerationRequest` returned an already successful session on the same UID/requestId **without comparing stored reviewed-source and provider-input hashes to the incoming request** or revalidating existence, owner, request ID, ready status and revocation of the original story. Different recollection/consent can be misattributed to an older creative story; not proven live exploitation.
- Patch requires SHA-256 reviewed-input and provider-input binding on every existing request, refuses incomplete legacy hashes, and transactionally reads the referenced original story with owner, request, ready and not-revoked guards. New `functions/src/storytime-request-binding.ts` Git blob `235853e22439db21b9373ab2ffbc19a3856d3d04`; callable `functions/src/storytime.ts` blob `d9e7f64cc7b019d7e810cecbbffac9064ccf17cd`; unit tests blob `e0bc235158d8eebfb4e59e436e6b7eb117cb2650`.
- Unlike earlier static-only checks, the pure helper and its test file were independently copied byte-identically to a local Node22 runtime, checked against exact Git blob SHA IDs and SHA-256, and **4/4 selected native tests PASS**. Fifth source-integration assertion NOT RUN; no full source clone/build/native Firebase, CI or provider acceptance. Evidence in #103 at `docs/estate/R904_GENERATION_IDEMPOTENCY_SOURCE_BINDING_20261107.md`.
- P0 required: ensure matched retry no extra spend and no duplicate story; reject changed source, signal, consent and wrongly owned/revoked original session under actual Firestore emulator transaction; reconcile legacy incomplete fingerprints intentionally (deny until reviewed, no blind rewrite). Cross-system signed Privacy source/owner/consent issuer and deletion fence remain unresolved. **Production HOLD.**
