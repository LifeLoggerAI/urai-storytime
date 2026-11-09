# ONE URAI GENESIS — R916 INDEPENDENT COMPLETE STORYTIME CONTINUITY AND SOURCE-AUTHORITY AUDIT

**Checkpoint:** 2026-11-08 America/Chicago (some provider timestamps 2026-11-09 UTC).  
**Decision:** **PRODUCTION NO-GO / HOLD.**  
**Scope:** read-only cross-repository forensic validation and additive documentation on the R915 handoff. No code merged, project deployed, live account altered, provider paid, or private human memory consumed.

**What this document is:** A verified R916 addendum to R913's exhaustive 383-file Storytime forensic audit, R914's independently corrected Git tree SHA, and R915's Storytime–Jobs paired private-media contract report. Keep all original predecessor reports and machine manifests. Do not represent this addendum as an independent runtime acceptance or all-byte archive extraction.

## 0. First-read source hierarchy and exact review heads

The next Chalk starts **R916_START_NEXT_CHALK.md → this report → R916_EXACT_SOURCE_AUTHORITY_AND_SYNTHETIC_ACCEPTANCE_MATRIX.json → R915 full paired-service handoff and its machine ledger → R914 Git object erratum → R913 full 14-section audit, 383-file/108-ref path census and machine truth/authorization/integration matrix → R908/#106 and 96-head original history #99 → Labs Genesis master #262.**

Rechecked current source refs:

| Authority | Exact observed head | Actual status |
|---|---|---|
| Storytime `main` | `73f586a0a2931961ae221af7cfc0caf1b6aef39d` | Existing published Git head, not current draft security branch |
| Storytime engineering PR #110 | `0c3358463c7a21db97c2932ce99c8f46e2419749` | OPEN / DRAFT / UNMERGED |
| Storytime R913 audit PR #111 | `8b0738a85e6eab32233f3308a336bd27a94a6351` | OPEN / DRAFT / UNMERGED |
| Storytime R914 audit PR #112 | `7360f85606397744ab26618fc3ac54d0ff3ea9e5` | OPEN / DRAFT / UNMERGED |
| Storytime R915 audit PR #113 | `37639263c41291656c8f51b0bcd6525ae6bfd783` | OPEN / DRAFT / UNMERGED |
| Jobs `main` | `9d29be1bcd3a45a4b9a743df9c9706c00811f38b` | Different bridge source from private-delivery review |
| Jobs private audio delivery PR #170 | `d379debb757a405b8757aa244e8bb87dfb574e37` | OPEN / DRAFT / UNMERGED; 2 COMMENTED reviews, no APPROVED review observed |
| Privacy `main` | `1163d6f32a123ef9a6638e092a3eee5ec4a3b317` | Canonical purpose registry inspected |
| Studio `main` | `854477d80b1a7aa718edb60d1ed4c1cf22dbed9d` | Media planning, not Storytime production proof |
| Content `main` | `988ca4f7f38b1ce86e4d3f426361b5866fd23e0d` | Storytime runtime integration RED absent evidence |
| Spatial `main` | `da94837c2457b0a7590e26a7a644cd728de8afb8` | Tier-2/Replay consent-governed; not independently accepted integration |
| B2Bportal `main` | `4aea8574970d28a293f921a34156c4cc5a971213` | RuAi remains separate; no assumed Storytime release authority |
| Labs private Genesis PR #262 | `8975076471bb1fa085fc5e69e93c593d02056169` | OPEN / DRAFT registry, not deployment approval |

All mutable refs must be refreshed before future work. Do not treat a branch name or PR review marker as a stable, deployed identity.

## 1. Preserved verified source inventory and corrected Git object

The source inventory is complete at **Git metadata level** for the R912 review head: **383 tracked files, 56 Git directories, 2,083,982 Git-reported blob bytes**, 77 paths added, 40 modified, 0 removed relative to 306-file Storytime main. The R913 machine file lists every tracked path, mode, Git SHA-1 and size. R914 independently fetched the actual Git tree and matched **383/383** entries, zero mismatches. The correct R912 **tree object** is `c0745b9d85e5939746ee2b505fb206b53b2cb1d4`; `0c3358463c7a21db97c2932ce99c8f46e2419749` is its **commit**, erroneously labeled as tree SHA in R913. Preserve the original record plus explicit R914 correction.

R913 saw 108 visible branch HEADs (after creating that docs branch). Previous PR #99 had 96 older heads and a distinct-blob historical census. These are dated snapshots. Neither is every intermediate/deleted/unreachable commit, all Git LFS bytes, all Cloud Storage, private memories, raw media or authenticated all-file SHA-256. Do **not** redo this unchanged metadata crawl unless exact engineering source changes.

## 2. Product implemented state: source ≠ integration ≠ production

Storytime has real original code for adult/guardian-operated direct-input story generation, structured sessions/chapters/moments/scenes, scripts, arcs, revisions, private drafts, moderation, server-written story canon, scoped export/deletion, bounded safe public-sharing, optional voiceover admission and guarded integration envelopes. R910 introduced uncertain-request reuse in the mounted form, R911 owner-only read-only recovery, R912 a per-user transaction-held fresh-request guard. This work was built and preserved, not merely contemplated.

The direct form's generation schema accepts `title`, optional `sourceText`, tone/motifs, `sourceSignals` labels, audience and review/consentSnapshot fields. It does not accept a cryptographically bound original `memoryId`/capture-hash/Privacy-issued source grant in that schema. It classifies completed generation as a **creative derivative, not recorded-source proof**. The Life Movie pure graph models `RECORDED_SOURCE_TRUTH`, `ATTRIBUTED_FAMILY_RECOLLECTION`, `SPATIALLY_RECONSTRUCTABLE`, `INTERPRETIVE_CINEMATIC_RECREATION`, `UNKNOWN_UNRESOLVED`; the claim-by-claim authenticated original source resolver is not accepted end to end. Historical parent-led locked children's StoryTime is distinct from later adult/guardian story creation; do not transfer rights or authorize child self-service by analogy.

Cross-service Studio, Asset Factory, Content and Spatial envelopes are guarded or hard-off where intended, and live protected Storytime → Jobs/Studio → Spatial Replay acceptance is absent. 19 additional locale targets are not enabled native-language releases. FINITE TIME source/canon/shot planning is governed preproduction, not a completed rendered/mastered/released autobiographical feature.

## 3. New R916 highest-priority findings

### Finding R916-A — canonical Privacy purpose registry does not include Storytime's voiceover purpose

Direct source readback from Privacy `main`:

- `functions/src/consent-decision.ts` Git blob `0f12c560a7772ccb362285e35d8745aa4eba5f69` defines the `consentPurposeRegistry` with `memory.storage`, `behavior.passive-context`, `location.context`, `inference.sensitive`, `biometric.identity`, `ai.personalization`, `data.export`, `research.public-good.aggregate`, `data.monetization.anonymized`. **Neither `storytime.voiceover` nor a distinct `storytime.story-generation` purpose is registered in that exact main source.**
- `functions/src/consent-api.ts` Git blob `3b03f3c0b25cddc9f4f612c967f177bb5faf4e44` implements `canonicalPurpose`: a purpose absent from the registry throws `HttpsError("failed-precondition", "Unknown consent purpose...")`. The setCanonicalConsent callable uses it. `functions/src/consent-revocation.ts`, blob `d56fdf48010afe163378390154ab42ae7baef660`, has event and acknowledgement logic. This is valuable implemented policy, not authorization for a purpose not yet registered.
- Storytime `functions/src/storytime-voiceover-consent-admission.ts`, blob `43d44560d392b7be908ba5d38e855828eb7f7d77`, **locally mints** a `storytime-consent-decision-receipt-v1` from source session and script consent. Jobs receives `purpose: storytime.voiceover`, policy version and receipt ID. Jobs `functions/src/privacy/consentBlocks.ts`, main blob `331dfd2ef7a379ac96fc0ea55e1fd0f317c6b7a0`, supports owner/purpose block lookup but does not independently verify a Privacy-issued signed **original captured memory/source** grant for this purpose.

**Consequence:** Do not claim the current canonical Privacy `main` can issue an approved `storytime.voiceover` grant just because Storytime has a locally authorized receipt. Do not add an ad hoc alias or expand registry policy without independent privacy/legal review, approved purpose classification, source ownership, issuer signature, expiry, revocation and receiver-verification contract. This is a source-contract gap, not proof that an incident or unauthorized production processing occurred.

### Finding R916-B — Jobs `main` does not implement Storytime's protected private-media protocol

Storytime source PR #110 expects `playback.delivery` descriptor `urai-authenticated-private-media-v1` and submits `action:deliver` from a Firebase-token-checked server proxy. Jobs **main**, `functions/src/jobs/storytimeNarratorBridge.ts` Git blob `cec3a4f6638aa3d646457b08f7c24e99cf4715a3`, has create/status/cancel/playback/delete-output but no deliver action, and returns short-lived signed GCS URL for playback. Jobs draft PR #170 current head `d379debb757a405b8757aa244e8bb87dfb574e37`, bridge blob `0729c324c4c600eb3092abbf3a2674486e257cc7`, **does** have `deliver`, bounded descriptor and protected streaming from `privateMediaDelivery.ts`, blob `2261b2f2bc315c2fa6935890af5294f553c0474a`.

This source-only comparison passed **10/10 targeted static invariants** in this review (not compiled/original tests). The earlier Storytime paired-source document cites an older Jobs #170 SHA; refresh to the current head. **Which Jobs build is deployed is not verified.** Do not enable narration by returning raw signed Storage URLs in the browser or by assuming draft code is live.

### Finding R916-C — GitHub repository protection/readiness is not verified

Live branch API returns `protected:false` for the `main` refs in Storytime, Jobs, Privacy, Studio, Spatial, Content and B2Bportal. The rulesets API returned **zero visible rulesets** for Storytime, Jobs, Privacy, Studio, Spatial and Content. Querying B2Bportal rulesets returned **403**, with private-repository subscription/feature limitation. Thus there is no positive evidence of effective protected-branch enforcement on the checked repos; for B2Bportal visibility is additionally limited. A false `protected` field alone does not prove no other organizational workflow/GitHub controls exist, so require independent effective policy readback, eligible reviewer, no bypass, required checks and deployment authorization before release.

### Finding R916-D — CI source-test cases exist, but exact paired runtime acceptance does not

Direct readbacks of selected original sources found these **test declarations**, not current passed executions:

| Test source | Git blob | Static top-level `test(` calls |
|---|---|---:|
| Storytime `tests/unit/storytime-voiceover-consent-admission.test.mjs` | `699ef7ba35c419027a5a7040ba0b65a38030e1f2` | 32 |
| Storytime `tests/e2e/storytime-narrator-delivery-authority.test.mjs` | `fc1c82397f04ee215acf82dec1a08b8ad44dd335` | 5 (parameterized expansions) |
| Storytime `tests/unit/storytime-narrator-delivery.test.mjs` | `ee8ffb24d5410e46bcda3c6c49ba2ccdb3a878d4` | 7 (parameterized expansions) |
| Jobs PR #170 `scripts/storytime-narrator-consent-transaction.test.mjs` | `02ece3f9dfe45790272ccba843b2c821f69b3f30` | 20 |
| Jobs PR #170 `scripts/private-media-preflight-cancellation.test.mjs` | `7180ef27f0ec4e073514f8e1d6fdf778be97b0ee` | 6 |
| Jobs PR #170 `scripts/private-media-download-authority-smoke.mjs` | `4dc4e6f4d1f7182c68c8cdbad51240391e126242` | Self-executing assertions (not node:test declarations) |

They cover local consent, idempotency, lease/races, owner denial, streaming and deletion semantics using synthetic harnesses. They are a real test source inventory. **They are not a single cross-project effective signed original-source consent → private Jobs media → replay → revocation/deletion runtime certification.** The current GitHub jobs on Storytime [#113] and Jobs #170 have zero executed steps in failing jobs; the runnable native project/build/emulator verification is unresolved.

**Additional script distinction:** Storytime root `npm run test` runs `node --test tests/unit/*.test.mjs tests/e2e/*.test.mjs`; `npm run emulators:test` uses Auth/Firestore/Storage local emulator executable and static/runtime/spec validators but does NOT by itself prove the actual protected Storytime–Jobs Functions calls or two-device owner concurrency. Jobs PR #170 root declares pnpm@8.15.9 and Functions Node22. A frozen source worktree, locks and actual harness are still needed.

## 4. Factual truth, family rights, and private asset ownership ledger

| Classification | Required human/source authority | Product status |
|---|---|---|
| Original recorded memory | Captured bytes/hash, owner/participants, source grant, version, timestamp, immutable evidence | Real source into Storytime generation not proven |
| Attributed recollection | Person who recalls it, date, confidence, disagreements, permission to use | Graph/source support, not automatically recorded fact |
| AI-generated interpretation | Model/input/prompt/output lineage; clear creative derivative label | Implemented for direct-input sessions; not source-proof |
| Unknown/disputed | Contradiction/uncertainty preserved, no invented certainty | Pure graph classes; enforcement across every generated claim pending |
| Human correction | Actor/version/reason/evidence and immutable prior state | Draft/revisions exist; claim-level truth migration pending |

Do not publish real family source, likeness, photos, medical/legal records, raw consent artifacts, personal private storage paths or encrypted/provider tokens in this public Storytime repo. Preserve previous owner source and downstream derivative restrictions, not an invented claim of factual certainty.

## 5. Current source implementation and provider/spend admission

The Storytime R912 guard requires exact owner, approved ready clearance, legacy and provider charges reconciled and syntax-valid SHA256 digest; holds owner guard and request claim in one Firestore transaction for fresh IDs. This is stronger than same-ID idempotency but has **NO trusted clearance issuer, provisioning or unlock**, so absent guard intentionally blocks every **new** generation, including a new user. The syntactically valid digest is NOT a signed issuer receipt. Do not issue arbitrary `ready` flags, infer clearance from the latest 12 R911 receipts, or assume story `succeeded` implies provider charge settled.

A release must reconcile historical pending/cancelled/charged/failed requests, generation lineage, provider account reservation/dead-letter receipts, source rights, current revocation and billing. Live paid generation, Apple/Google provider readiness, verified Firebase project identity, Storage rules and deployed source SHAs are not established in R916. Avoid all spend.

## 6. Synthetic P0 acceptance matrix — specified, NOT run

The R916 machine file `R916_EXACT_SOURCE_AUTHORITY_AND_SYNTHETIC_ACCEPTANCE_MATRIX.json` contains **45 independently specified test cases** across 7 areas:
- canonical purpose registration and consent evaluation;
- signed original-source/owner/purpose/expiry/revocation grants;
- Storytime–Jobs create/playback/deliver negative and positive paired authority;
- transactionally held generation/duplicate-provider-spend lock;
- protected storage stream, cancellation and downstream purge;
- recorded/recollection/generated/disputed factual provenance;
- effective protected CI/reviewer and source/deployment/device checks.

**Every case has `status: NOT_EXECUTED_AT_R916`**. Required evidence includes exact SHA, executable test command, original log digest and fixture identity, authoritative Firebase emulator resource versions, denial/readback, independent reviewer and actual production-target proof when approved. Do not mark planned cases passed. Test inputs must be invented synthetic story text/identities, with no paid providers or real private content.

## 7. Release blocker matrix

**P0:** actual protected CI and independent approvals; full frozen original source builds/tests; effective Firebase project/site/Functions/Firestore/Storage/Auth/App Check/IAM; correct Jobs private-media protocol at reviewed source SHA; registered and signed source-specific Privacy grant whose receiver independently validates issuer/current authority; R912 legitimate settled-charge clearance; two synthetic devices competing over fresh generation; private protected Jobs/Studio → Spatial Replay; source revoke/deletion/provider/backup acknowledgement; physical devices, reduced motion/captions, family/guardian rights, founder visual signoff and safe rollback.

**P1:** claim-level evidence/provenance ledger, attributed disputes and human corrections, legacy inaccurate `whyGenerated` migration, owner-specific historical request pagination, safe share/redaction/cache invalidation.

**P2:** native-quality 19 additional languages, accessibility/screen-reader/keyboard/touch/device matrix, guardian/third-party consent review, licensed assets, opt-in voice authorizations.

**P3:** full raw byte SHA256 historical Git/LFS/Cloud/Drive/provider/backup coverage, deleted/unreachable history, exact current runtime billing and infrastructure forensic readback.

## 8. Historical and Drive evidence retained

The primary old Drive Storytime due diligence document `1fe4QdvCH0HJKpIjSqo1b1ojapz-Yli3hEEvw7L5RiFI` is a September 2026 historical PR #38 authority explicitly not production-certified. July 14 `1lszZ_rm1dU6XDfE-ydq8yDWzjhyz23HBUGsVldinqZA` reports historical PR #24 58/58 source/unit/E2E, 16/16 smoke and builds, explicitly not behavioral Firebase/cloud/provider. FINITE TIME `1HfN5oJpwauIykzbyrpCeZQ9OHGSjP2rKt0JxB0E71fY` is July private screenplay/rights/media authority, not finished film. R916 did not traverse every Google Drive item or read actual media/real memories. Private Labs PR #262 remains the central Genesis estate evidence index, not deployment authority.

## 9. Next Chalk precise continuation

Read R916 start, report and machine matrix; R915 paired service contract, R914 SHA integrity correction, R913 complete source/worker history, and current Labs registry. **Do not restart the unchanged 383-file audit**. Refresh source refs. Repair actual GitHub runner/protection and prove paired synthetic Auth/Firestore/Functions/Storage. Conduct explicit original Privacy registry/purpose/signature design and independent source grant verification at Jobs. Compare Jobs PR #170 exact private descriptor/delivery, not Jobs main signed URL. Implement governed historical provider charge/clearance issuer for R912 without manual unlocking. Prove protected private story and narrator playback, simultaneous revocation and downstream erasure. Preserve UNKNOWN/DISPUTED, recorded facts, attributed recollection and AI creative derivative as different classes. Keep production **HOLD** until exact end-to-end acceptance, independent approval and device/visual/governance/provider gates are evidenced.

**R916 adds verified source findings and a reproducible test specification; it does not claim actual execution, live resource access, or production certification.**
