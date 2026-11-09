# ONE URAI GENESIS — R914 INDEPENDENT STORYTIME FORENSIC REVIEW / ERRATA / NEXT-CHALK CONTINUATION

**Review only. Production NO-GO / HOLD.** Checkpoint 2026-11-08 Central / GitHub timestamps can show 2026-11-09 UTC. This is an additive independent verification of the prior full [R913 PR #111](https://github.com/LifeLoggerAI/urai-storytime/pull/111) handoff. It does **not** replace R913's long-form architecture, 383-path inventory, 16-PR worker matrix or recorded-source/AI truth ledger. No runtime code, live Firebase, paid provider, private memory, account, branch merge or deployment changed.

## 1. Verified base and audit material

Re-read PR #111 current head **8b0738a85e6eab32233f3308a336bd27a94a6351**, R912 engineering PR #110 **0c3358463c7a21db97c2932ce99c8f46e2419749**, and prior master PR #99 **a1d9153a8b9308090649f2ede0f0eb7b43d74db8**. As rechecked, all 16 selected worker PRs #83, #96–#111 were OPEN/DRAFT/UNMERGED with the same head SHAs as R913's worker ledger. Current main source **73f586a0a2931961ae221af7cfc0caf1b6aef39d** has not inherited these draft fixes. R913 contains four files only, all present and readable: R913_START_NEXT_CHALK.md, the full 14-section forensic reconciliation, the exact tracked-file and visible-ref manifest, and the truth/owner/dependency/CI/backlog ledger.

The historical, independent [R908 PR #106](https://github.com/LifeLoggerAI/urai-storytime/pull/106) and old [PR #99](https://github.com/LifeLoggerAI/urai-storytime/pull/99) remain source-authority references. R914 builds a **separate docs-only review branch from PR #111**, not a new engineering authority or launch-candidate merge.

## 2. Confirmed Git object SHA correction — critical erratum

The R913 JSON `R913_EXACT_R912_SOURCE_TREE_AND_VISIBLE_BRANCH_HEADS.json` contains `source_git_tree_sha = 0c3358463c7a21db97c2932ce99c8f46e2419749`. This is the source **commit SHA**, NOT the actual source Git **tree-object SHA**. GitHub's `/git/trees/{commitish}` resolution returned the commit-ish in its response `sha` field while providing the correct resolved tree entries. R914 independently opened the actual Git commit object to obtain its `tree.sha`, then fetched that actual tree object by its exact SHA.

| Entity | Correct independent object identity |
|---|---|
| R912 head **commit** | `0c3358463c7a21db97c2932ce99c8f46e2419749` |
| R912 head **tree object** | `c0745b9d85e5939746ee2b505fb206b53b2cb1d4` |
| Main head **commit** | `73f586a0a2931961ae221af7cfc0caf1b6aef39d` |
| Main head **tree object** | `f847d3bfbcf5bc07258107f5a18338a62480a14f` |
| R913 manifest original **Git blob** | `023928468ee233a249cc844a4b4461ec2ee0fa41` |

**Full row-by-row integrity result:** 383/383 tracked R912 manifest entries match the actual Git tree by path, mode, Git blob SHA-1 and Git-reported size; 0 mismatches, 0 extra paths, 383 actual blobs, 56 directories and **2,083,982 reported Git blob bytes**. Main was also independently resolved (306 blobs). The 77 added / 40 modified / 0 removed file delta is retained. The JSON machine receipt `R914_CORRECTED_GIT_OBJECT_INTEGRITY_AND_CI_RECEIPT.json` preserves the precise discrepancy, corrected object IDs, unchanged file inventory validation and CI job evidence.

**Scope:** source metadata integrity is not full raw-file SHA-256, not a cryptographically verified provenance receipt for any real memory, not an all-intermediate-commit/LFS/external media inventory, and not product or emulator execution. Preserve the historical original R913 manifest unchanged for forensic trace; use this R914 erratum as its correction, not a silent rewrite.

## 3. Branch and worker history — freeze source, not count

R913's branch-head JSON recorded 108 visible refs. Fresh R914 page reads returned 100+8 visible heads after creating this docs branch, with the old R913 docs branch now pointing to its final audit commit rather than its creation-base SHA. The old ref snapshot is dated by definition; before counting new R914 references, 108 were visible. Do not use any count as a total of intermediate/deleted/unreachable commits.

All 16 examined engineering/forensic PR heads remained unchanged. The list is pinned in the R913 machine ledger; **do not waste next-worker time rewriting those PR summaries** unless the head moves. Their common source chain remains: #83→#96→#97; #100 Rules and #101→#102 auth donor branches; #103→#104→#105 retry/cancel/source-truth; #107 integrated donor branch→#108 UI uncertain status→#109 owner recovery→#110 admission guard. Forensics #98→#99→#106; docs-only #111, then this R914 addendum.

## 4. Newly verified source details and hard deployment limits

Direct source readback at PR #110:
- `functions/src/storytime.ts`, Git blob **95716cf1beb2f2382657f5c5934ad4a516e3a133**: `claimGenerationRequest` reads the exact owner+request ID; an existing succeeded claim requires original owner/review digest/approved-ready session; processing/cancelled/unknown cases refuse reuse. For a **new** request it reads the UID-keyed `storytimeGenerationAdmissionGuards` inside the same Firestore transaction, demands `isClearedStorytimeAdmissionGuard`, then writes HELD guard + processing request in the same transaction. This is a structural transaction boundary, **not run-time evidence of contention**.
- `functions/src/story-generation-admission.ts`, Git blob **01079313fd93d6340364aed9cd3ace86b52c51a5**: clearance needs exact owner/schema, state ready, null activeRequestId, legacyRequestsReconciled=true, providerChargesReconciled=true, and a **syntactically** valid 64-character lowercase SHA256 field. No trusted issuer/signature or actual provider settlement evidence is verified. Newly held state writes all clearance booleans false/null. There is NO normal provisioning/unlock issuer in this patch.
- Quota failure after admission marks the request failed; provider reservation failure marks it failed; charged/uncertain provider paths hold budget and retain dead-letter records; even a succeeded story is not automatically evidence charges are reconciled. **Guard remains held**. This is intentionally fail-closed, and currently blocks every NEW generation whose guard is absent. Do not deploy as an operational public generator.
- `functions/src/story-generation-recovery.ts`, Git blob **ed3da697df1250d62ebd0c11cb0d62224737a97c**: owner UID + verified email, exact ID or bounded latest-12 server query; verifies approved original session before presenting a ready link and returns minimal receipts with `retryAuthorized:false`. This is read-only status, NOT clearance, not guarantee that all historical requests have been enumerated.
- `src/components/storytime/StorytimeHome.tsx`, Git blob **ea8f49c45151f222325e953c32405302e0767a7f**: R910 in-mounted-page unknown-result hold, same-input same-actor request identity; R911 recovery view mounted; requires browser/auth-epoch tests. Refs are not durable across devices.
- `.firebaserc`, Git blob **96967b104fd87402158f137e2d2ad6dbe839d1d7**, still defaults to **REPLACE_WITH_URAI_STORYTIME_STAGING**. Actual live Firebase project, rules/index IAM and deployment SHA are NOT certified.
- `firebase.json`, Git blob **ae5dd32e79d8942925bb208021c17e0f56456347**, declares Functions Node 22, framework Hosting and local emulators for Auth 9099, Functions 5001, Firestore 8080, Storage 9199; declarations are not an actual deployed/working environment.

The actual root package source scripts indicate `npm run test` runs Node unit + e2e file patterns, and `npm run emulators:test` runs static rules checks/runtime/spec validators under Auth/Firestore/Storage emulator executable, **not a complete callable transaction and user B negative suite by itself**. The Functions package targets Node 22; CI root uses Node 24. Avoid claiming the scripting scaffold demonstrates behavior.

**Coverage gap discovered in workflow trigger:** `.github/workflows/public-share-rules-emulator.yml` is triggered by specified Rules, index, existing sharing component and Functions index paths. It does not list the new `functions/src/story-generation-admission.ts` or `functions/src/storytime.ts` directly. The R912 PR changed `firestore.rules`, so that PR's Rules workflow was triggered; however a future isolated modification to only those two generation files might not run that specialized workflow unless its path filters are updated. Root CI has a separate test/build lane but must actually execute. This is a test-policy gap and must be corrected before trusting future clearance/transaction changes.

## 5. CI / approval exact-head receipt (refreshed)

At PR #111 head `8b0738a85e6eab32233f3308a336bd27a94a6351`:
- Visual run **42564032696**, job **128986500896** — completed/failure, blank runner, **0 executed steps**.
- CI run **42564032705**, root job **128986501217**, Functions job **128986500978** — completed/failure, blank runner, **0 executed steps**; native disposable Auth/Firestore/Functions job **128986502206** and production-only job **128986502209** skipped.
- Verify run **42564032775**, job **128986501295** — completed/failure, blank runner, **0 executed steps**.
- PR #111 submitted review list: **empty**, no accepted independent approval.

This is a CI execution/startup issue with **unknown root cause**, NOT proven source test failure. Historical PR #96 success remains specific to its old SHA and synthetic disposable tests. No full fresh R913/R914 root install, TS, Next/Functions build, native Firebase owner A/B or two-device admission acceptance exists.

## 6. Preservation and evidence scope

R913's 14-section report, 383-file Git manifest and machine feature/truth/authorization/integration ledger remain the canonical substantive Storytime audit. R914 is an **independent audit correctness addendum**. Neither document grants access to old child/family sources or provider records. The September Storytime Drive authority document (ID `1fe4QdvCH0HJKpIjSqo1b1ojapz-Yli3hEEvw7L5RiFI`) was read in R913 and remains dated historical authority (points to old PR #38), not a substitute for the current #110/#111 source. Full Drive history, exact LFS/cloud media and complete intermediate Git commit inventory still not performed.

**Story truth cardinal rule:** verified original recorded source ≠ dated human recollection ≠ AI interpretation. Client `sourceSignals` are labels, not source capture or consent. Current narration is marked `creative_derivative_not_source_evidence`. The old locked parent-guided StoryTime policy is separately scoped and cannot authorize current child personalization. Original photos, audio, participant rights, conflicting testimony, claims/corrections and provider derived media must retain their own immutable lineage; no real user's personal materials were used in R914.

## 7. Next Chalk action order (P0 before anything else)

1. Start at R914 addendum + R913 main report and machine ledgers. Refresh latest PR heads and actual job status; do not re-inventory the already proven 383 path rows unless the engineering source SHA changes.
2. Restore a real CI runner, protected branch, eligible reviewer. With a trusted exact-source checkout run frozen dependency installs, root tests, typecheck, Next build and Functions Node22 compile. Record full log/artefact hashes.
3. Add appropriate mandatory generation-admission workflow path filters and write **real Firebase emulator tests**: two same-owner devices/new IDs, verified ready guard, one succeeds/one blocked, malformed owner and clearance, cancelled/failed/needs-review/held charge, no early guard unlock; client owner/other/admin claims cannot write guard; independent server IAM review.
4. Do not invent `legacyRequestsReconciled`, `providerChargesReconciled` or a 64-hex `clearanceReceiptSha256` merely to allow generation. Define actual **trusted signed clearance issuer**, complete legacy owner request sweep and provider settlement/dead-letter reconciliation, expiry/revocation, migration and rollback with independent approval. Missing guard remains fail-closed.
5. Continue canonical signed Privacy actor+original recorded source+purpose+version grant and claim-level recorded/recollection/generated truth; authenticated Jobs media → Spatial Replay → revoke/delete/purge proof with real protections but synthetic fixtures.
6. Complete physical device, accessibility, children/third-party legal rights, visual AAA+++ and rollout/rollback approvals.

**Release decision unchanged: production HOLD / NO-GO.** All current code improvements are real but not complete production acceptance. No merge, deploy, provider spend, credential rotation or private real-memory access was performed in this R914 forensic continuation.

## 8. Exact handoff resume command

Continue ONE URAI GENESIS Storytime from R914 independent integrity/CI addendum, its R914_CORRECTED_GIT_OBJECT_INTEGRITY_AND_CI_RECEIPT.json, then R913_START_NEXT_CHALK.md, R913_COMPLETE_STORYTIME_GENESIS_FORENSIC_RECONCILIATION.md, R913_EXACT_R912_SOURCE_TREE_AND_VISIBLE_BRANCH_HEADS.json and R913_TRUTH_AUTH_INTEGRATION_AND_RELEASE_LEDGER.json, plus historical Storytime #99/#106, engineering #83/#96–#110, and private Labs master #262. Fix the mislabeled R913 tree object field by using the correct R914 tree SHA while retaining prior manifest. Refresh all heads/CI, focus next on real runner, exact-source Firebase transaction race and scoped signed clearance issuer; never create fake permission or spend settlement receipts. Preserve recorded source, human recollection, AI interpretation, unknown/disputed and human corrections. No merge/deploy/paid provider/real private memory, production HOLD.
