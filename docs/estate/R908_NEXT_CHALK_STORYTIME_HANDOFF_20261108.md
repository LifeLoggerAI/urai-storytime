# ONE URAI GENESIS — Storytime R908 next Chalk handoff

**Production HOLD / review only.** Date November 8 2026 Central. This adds independent forensic evidence to earlier [Storytime PR #99](https://github.com/LifeLoggerAI/urai-storytime/pull/99), not a runtime merge or product certification.

## First open, in order

1. [Master private Labs Genesis PR #262](https://github.com/LifeLoggerAI/urai-labs-llc/pull/262) and its docs/estate/WORKER_PROTOCOL.md + EVIDENCE_STANDARD.md; preserve current source refs, no private master details in public repo.
2. [Storytime prior forensic PR #99](https://github.com/LifeLoggerAI/urai-storytime/pull/99), especially docs/estate/08_NEXT_WORKER_HANDOFF.md; docs/estate/MANIFEST.json; all eight history/BRANCH_TREES_*.json and BRANCH_HEAD_AGGREGATE.json.
3. [R908 full source/truth/integration report](R908_STORYTIME_COMPLETE_FORENSIC_RECONCILIATION_20261108.md), [PR #105 363-file manifest](R908_PR105_EXACT_HEAD_FILE_INVENTORY.json), [R908 native/CI receipt](R908_EXACT_SOURCE_AND_NATIVE_TEST_RECEIPT.json).
4. [Original owner #83](https://github.com/LifeLoggerAI/urai-storytime/pull/83), [synthetic emitter #96](https://github.com/LifeLoggerAI/urai-storytime/pull/96), [guard #97](https://github.com/LifeLoggerAI/urai-storytime/pull/97), independent security [#100](https://github.com/LifeLoggerAI/urai-storytime/pull/100), [#101](https://github.com/LifeLoggerAI/urai-storytime/pull/101), [#102](https://github.com/LifeLoggerAI/urai-storytime/pull/102), retry chain [#103](https://github.com/LifeLoggerAI/urai-storytime/pull/103), [#104](https://github.com/LifeLoggerAI/urai-storytime/pull/104), [#105](https://github.com/LifeLoggerAI/urai-storytime/pull/105).
5. Storytime Drive [Deep-Dive Due Diligence](https://docs.google.com/document/d/1fe4QdvCH0HJKpIjSqo1b1ojapz-Yli3hEEvw7L5RiFI/edit) is dated September 2026 and refers to old PR #38; use as policy history, not current exact-head CI authority.

## Exact source pins at R908

- main: **73f586a0a2931961ae221af7cfc0caf1b6aef39d**, 306 blobs / 1,356,257 reported bytes.
- owner PR #83: **33ecc480ffe96e83647a29e09969defeb84ca3fd** (unmerged).
- PR #96: **31cf72a01b65667de89c9ad565b6f0a4e51759a0**, historical three green workflows Oct 15 with disposable emulators.
- PR #97: **312240f5da9042a2cc9d11dac179bed90dee51d1**, target guard draft and red actions.
- PR #99: **a1d9153a8b9308090649f2ede0f0eb7b43d74db8**, preserved historical forensic pack.
- PR #100: **f0efee038d0acdcf8c74f4108c03c41e32bedfd1**, independent Rules server-owned canon.
- PR #101/#102: **598c969fe4a258331c442692887903bacadf42fa** / **9be92015f1f9b42101e224aedf92807d0777cdcb**, private UI account-switch fences.
- PR #103/#104/#105: **57b54044bb6e61713c75ba559166a1128244dc19** / **94022314d331cac68fe48e93d52f438a12c1e96d** / **c01963408da4deabcc27a98156bafcd1f7b10ab7**; sequential retry, cancellation, provenance wording.
- Source blobs at #105: functions/src/storytime.ts **809154cc65156e54e209292e8df87bdbd1074803**; functions/src/storytime-request-binding.ts **ce28459340e271c108756248ae46ec95df6e3be6**; src/lib/storytime/redaction.ts **4a0e97ed2d6d0c8798ed8ff25b40895d2e8136ae**; firestore.rules **6af88a7cb0ecbfa7ee7256bba80a9fcfc24a83d5**.
- Jobs downstream main source functions/src/jobs/storytimeNarratorBridge.ts blob **cec3a4f6638aa3d646457b08f7c24e99cf4715a3** at time of inspection; re-fetch any current head before release.

## What is done in R908

- Re-read Genesis protocol, Storytime 00–09 pack, original locked children's historical canon, Storytime→Jobs R901, R905/R906/R907, recent PR heads and current Actions jobs.
- Refreshed full untruncated GitHub tree for #105: **363 tracked files, 56 directories, 1,983,260 Git-reported blob bytes**, machine-readable metadata committed; no naive claim of full raw-byte or external Storage coverage.
- Refreshed branch index: **102 names on first 100 + next 2 pages before R908 branch creation** vs prior historical 96; this R908 branch adds another new ref. Do not present 96 as current branch count.
- Read original direct-input story flow and verified no sourceSignals in providerInputFromRequest or local builder narrative inputs; private original memory graph resolver not confirmed. Story session is explicitly creative_derivative_not_source_evidence.
- Verified R907 copy update avoids source-label exposure and false attribution. **Existing historic saved whyGenerated still unresolved**, migration requires owner consent and immutable version provenance.
- Independently ran **10/10 synthetic native Node 22.16.0 tests** on the exact 974-byte Git blob-verified helper source (raw SHA-256 **d21b5a7b84ed6564f5108c43f0b065b02d71e430101e1b8eafb88d214bde1953**). Original executed script and TAP log were retained as local audit artifacts; hashes and 10 test case names are in R908 JSON. Never promote this to full repo pass.
- Fresh #105 Actions all **failure**: CI 42536900659, Verify 42536900653, Visual 42536900738. Failed jobs empty runner/zero steps; four raw-log requests 404 BlobNotFound; native emulator skipped. **Root cause UNKNOWN**, not proof of tests failing.
- Documented privacy/owner/canon/Jobs source graph and P0–P3, separated historical child policies from newer creative memory app. No production, spend, real media, provider call, personal data or release change.

## Next safe execution, prioritized

1. **Refresh all PR heads and current GitHub Actions run/job logs** before touching code. Do not reuse successful #96 results for changed heads. Diagnose failing runner/jobs via API and support; do not guess that code tests failed.
2. Build a **disposable integration branch** from a reviewed current engineering head. Reconcile the isolated PR #100 server-owned Rules with independent PR #101/#102 account-switch UI and #103/#104/#105 idempotency/cancellation/provenance changes; identify overlapping files in advance, preserve all original branches, no force push or unreviewed merge.
3. With isolated nonproduction identity and no provider: exact-source frozen root npm ci; npm run typecheck; npm test; npm run build; npm --prefix functions ci; npm --prefix functions run build. Root package scripts verified on current PR #105; CI uses root Node24 and Functions nodejs22. Do **not** run deploy scripts or invoke paid providers as a shortcut.
4. Run the **actual four-service Auth/Firestore/Functions/Storage emulator** behavior matrix from a frozen head. Root npm run emulators:test in the existing package only runs some scaffold/runtime/spec checks; it is **not by itself** the full behavioral Rules contract. Reuse PR #96 native disposable harness and add: owner A/B, impersonation/role, forged canon/audit, onAuthStateChanged delayed list and autosave races, retry/cancel transaction conflicts, same requestId with changed source/provider SHA, revoked/unknown/malformed claims, moderation needs_review, shared-family permissions, private data denial after revocation, Jobs token/cross-project receipt denial. Preserve full original logs and hashes.
5. Integrate canonical Privacy signed per-source+actor+purpose+version+expiry consent issuer into Storytime and Jobs. Synthetic captured-memory selection must carry immutable original source byte hash and distinguish recorded source, attributed recollection, unverified allegation, AI creative reconstruction and human correction.
6. Only after safe emulator proof, seek authorized isolated staging IAM and real protected browser/Jobs/Replay acceptance. User-specific media, production cloud, paid OpenAI/provider, real child profiles, voice likeness and backup deletions require separate explicit authorizations and qualified privacy/legal review. No production or merge until all gates pass.
7. Move accepted source hashes, reviewer outcome, and full test/CI/deploy receipts into the public Storytime PR review and a **separate private** Labs registry relay; update the ChatGPT Space worker page. Preserve old PR #99 history and this R908 review evidence.

## Completion decision

**P0 release blockers remain.** Storytime narrative creation and multiple real protection modules exist in code, but there is no proven **private, source-authenticated, consented recorded-memory → Storytime → Jobs/Studio → protected Replay → revocation/deletion** acceptance. User-supplied sourceSignals are not source evidence. Historical child StoryTime behavior rules remain an independent product-policy authority. Never claim a generated story is a recorded fact.

## Safe cross-chat resume prompt

Continue ONE URAI GENESIS Storytime from this handoff. Open Storytime R908 review PR and docs/estate/R908_STORYTIME_COMPLETE_FORENSIC_RECONCILIATION_20261108.md, R908_PR105_EXACT_HEAD_FILE_INVENTORY.json, R908_EXACT_SOURCE_AND_NATIVE_TEST_RECEIPT.json. Open earlier Storytime PR #99 and current worker PRs #83/#96/#97/#100/#101/#102/#103/#104/#105, then private Labs master PR #262 and this Space. Refresh all PR heads/Actions; do not rerun inventory already preserved unless source refs change. Investigate P0 CI runner and exact-head consent/canon/auth race gates. Run safe exact-source emulator/negative tests with synthetic users only. Preserve remembered recollection, recorded source and creative AI interpretation as distinct. Do not merge, deploy, spend, or touch private real memories. Save new evidence to a separate review PR and link it privately to Labs/Space. Production HOLD.
