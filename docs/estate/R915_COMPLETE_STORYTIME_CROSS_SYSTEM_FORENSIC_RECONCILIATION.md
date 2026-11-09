# ONE URAI GENESIS — R915 STORYTIME FULL CROSS-SERVICE RECONCILIATION AND NEXT-CHALK HANDOFF

**Status: PRODUCTION HOLD / NO-GO.** Review-only audit, November 8 2026 Central (some GitHub evidence dates Nov 9 UTC). This document is an additive reconciliation after [R913 full audit PR #111](https://github.com/LifeLoggerAI/urai-storytime/pull/111) and [R914 independent erratum PR #112](https://github.com/LifeLoggerAI/urai-storytime/pull/112), not a replacement for their 383-file/108-ref estate inventory, 14-section history, 16-worker matrix, corrected Git object SHA, or P0–P3 backlog. No runtime branch, deployment, provider, private memories or user account was altered.

## 0. Start here — next Chalk route

Read this R915 file and `R915_STORYTIME_JOBS_EXACT_SOURCE_CONTRACT_AND_TRUST_LEDGER.json`, then R914 source integrity erratum and corrected Git tree receipt, followed by R913_START_NEXT_CHALK.md, R913 complete forensic report, its full 383-path/visible-branch manifest and machine authority/integration ledger. Refresh PR heads and exact CI before any new action. Read private [Labs Genesis master PR #262](https://github.com/LifeLoggerAI/urai-labs-llc/pull/262) and original [Storytime historical forensic #99](https://github.com/LifeLoggerAI/urai-storytime/pull/99). Main and the reviewed Storytime engineering lineage are NOT equivalent. Do not deploy, merge, spend, issue synthetic real owner consent or access private memories.

**Known review pins:** Storytime source engineering [#110](https://github.com/LifeLoggerAI/urai-storytime/pull/110) commit `0c3358463c7a21db97c2932ce99c8f46e2419749`; R913 docs [#111](https://github.com/LifeLoggerAI/urai-storytime/pull/111) `8b0738a85e6eab32233f3308a336bd27a94a6351`; R914 docs [#112](https://github.com/LifeLoggerAI/urai-storytime/pull/112) `7360f85606397744ab26618fc3ac54d0ff3ea9e5`. All observed open/draft/unmerged. Storytime main was `73f586a0a2931961ae221af7cfc0caf1b6aef39d`. Jobs main bridge Git blob `cec3a4f6638aa3d646457b08f7c24e99cf4715a3`; Jobs [PR #170](https://github.com/LifeLoggerAI/urai-jobs/pull/170) current head `d379debb757a405b8757aa244e8bb87dfb574e37`, open/draft/unmerged.

## 1. New highest-impact R915 finding — TWO different Jobs delivery protocols

This pass compared original Storytime and Jobs sources directly instead of relying only on narrative integration summaries.

**Storytime requires protected proxy delivery:**
- `functions/src/storytime.ts`, blob `95716cf1beb2f2382657f5c5934ad4a516e3a133`: `prepareVoiceoverJob` stages local consent, sends the bridge create payload, and on response creates local job/export/event bindings. `manageVoiceoverJob` expects `playback.delivery`, parses `StorytimeNarratorDeliverySchema`, then hands descriptor to the browser.
- `functions/src/storytime-media-delivery-contract.ts`, blob `9511c1c2840db9554d1edab07357c0de084b2e5b`: descriptor version `urai-authenticated-private-media-v1`, `action:deliver`, `kind:audio`, `authorityHash`, exact Storage `generation`, deadline, job/session/script identity.
- `functions/src/storytime-voiceover-delivery.ts`, blob `3801bbd3a6931e6da7d3291c2e2bbae73fa976ca`: `deliverStorytimeVoiceover` owner-token verified server proxy uses Jobs bridge `{action:"deliver",kind:"audio",...}`. Rechecks Storytime owned session, script, local voiceover consent receipt, relevant pending deletion, token revocation, authority hash and deadline, before and during private chunk streaming; no Jobs credential/Storage URL is sent to the browser.
- `src/lib/storytime/narrator-delivery.ts`, blob `9812ea3cb7066bd38bfb5b11a9285ab0134a34f`, implements a browser caller for that proxy but the source doc `docs/STORYTIME_AUTHENTICATED_PRIVATE_DELIVERY.md` explicitly says no mounted product audio UI consumes it and voiceover is hard-off. **A library function and synthetic test do not prove user playback is wired or deployed.**

**Jobs MAIN bridge is NOT source-compatible for protected delivery:**
- `functions/src/jobs/storytimeNarratorBridge.ts` at Jobs main, Git blob `cec3a4f6638aa3d646457b08f7c24e99cf4715a3`, `RequestSchema` is union of create and status/cancel/playback/delete-output. It does **not** accept `action:deliver`.
- Its `playback()` returns a short-lived GCS signed URL and metadata, **not** the `playback.delivery` descriptor Storytime requires. Even a successfully accepted create request cannot prove private Storytime proxy playback works with this Jobs source.

**Jobs private-delivery PR #170 contains the matching SOURCE, but is unmerged:**
- At observed head `d379debb757a405b8757aa244e8bb87dfb574e37`, `functions/src/jobs/storytimeNarratorBridge.ts`, blob `0729c324c4c600eb3092abbf3a2674486e257cc7`, has `DeliverSchema` and a `deliver` handler. `playback()` returns the `urai-authenticated-private-media-v1` descriptor with owner/session/script, generation and authority hash.
- `functions/src/jobs/privateMediaDelivery.ts`, blob `2261b2f2bc315c2fa6935890af5294f553c0474a`, includes storage generation-pinned private streaming, 64-KiB revalidation and endpoint cancellation, and Jobs' owner/consent-block/deletion-tombstone checks. `deleteOutput` first fences media access with REVOKED+PENDING, then removes the GCS object and marks COMPLETE only after a matching output check. These are meaningful SOURCE protections, **not proof of live protected audio or provider/backup deletion**.
- The Storytime doc `docs/STORYTIME_AUTHENTICATED_PRIVATE_DELIVERY.md` cites an **older Jobs PR #170 head `fbed3acb0e55f3abbbf15d3cba7fb82d1a2dd3bd`**. It must be repinned to the current reviewed Jobs #170 head and retested. Never transfer acceptance from the older head.

**Disposition:** The Storytime–Jobs create path has compatible schema elements; the **playback and deliver paths are INCOMPATIBLE with Jobs main**. The paired Jobs PR #170 implementation is a promising unmerged SOURCE candidate. The actual deployed Jobs source and Firebase/Storage runtime were not determined, so there is no claim a production playback error or data exposure happened.

## 2. Consent boundary — local Storytime evidence is NOT canonical Privacy authority

Storytime's `functions/src/storytime-voiceover-consent-admission.ts` blob `43d44560d392b7be908ba5d38e855828eb7f7d77` creates `storytime-consent-decision-receipt-v1` locally from `storySessions` consentSnapshot, approved and not-revoked session/script checks. It writes a recoverable dispatch intent in the same **local** Firestore transaction. It explicitly documents no cross-service atomicity. It later rereads source/receipt/intent before materializing Jobs identity, with reconciliation-required states if the remote response fails or cannot be persisted.

Jobs create receives `purpose:storytime.voiceover`, `policyVersion`, and `decisionReceiptId` plus owner/session/script, narrator payload and idempotency key. The Jobs main and PR #170 bridge check a purpose-scoped `jobConsentBlocks` record, validate fields, and bind owner+source IDs to the created job. There is **no demonstrated independent fetch and signature verification at Jobs of a canonical Privacy-issued current grant for the original UrAi recorded source**. An ID string and server-to-server bearer token are not the original memory's informed use permission. A source event must carry specific owner+recorded asset+purpose, issuer, digest, consent version, expiry, current revocation and downstream identity/lineage.

The Jobs PR #170 pre-create transaction checks its purpose block inside the job creation transaction (stronger than the precheck on Jobs main), and streaming rechecks owner and blocks. These features remain separate from verified signed original-source consent. **Do not upgrade the state from partial to certified solely because PR #170 contains a guarded media proxy.**

## 3. Current source-to-story fact classifications

The direct Storytime generation path uses **submitted title/sourceText/tone/motifs**, not authenticated captured photos/audio. It marks sessions `direct_storytime_input`, `creative_derivative_not_source_evidence`. `sourceSignals` are stored user-supplied unverified labels; R907 corrected false explanatory attribution for new records. The Life Movie truth graph distinguishes recorded source, attributed recollection, unknown/disputed and generated derivative but is not integrated as enforced support per generated scene. Human corrections should be immutable attributed versions, not edits to original recorded bytes.

The old locked parent-led children's StoryTime policy is separate from current adult/guardian-operated story creation. FINITE TIME's Drive canonical production authority, July 2026, is a real historical screenplay and media governance program, **not proof of completed movie**. It forbids unsanctioned likeness/voice/paid render and requires factual-confidence and rights ledgers. Private Drive source cannot be copied into public forensic evidence.

## 4. External Google Drive authority recovered (metadata and relevant text verified)

- `1fe4QdvCH0HJKpIjSqo1b1ojapz-Yli3hEEvw7L5RiFI`, **URAI Storytime — Deep-Dive Due Diligence & Completion Authority**, modified 2026-09-24, 15,833 readable characters. Explicitly not production-certified and names prior draft PR #38. It is historical policy, not current #110 authority.
- `1lszZ_rm1dU6XDfE-ydq8yDWzjhyz23HBUGsVldinqZA`, **URAI-100 Storytime Exact-Head Artifact Inspection Receipt — 2026-07-14**, 6,143 readable characters. Exact old #24 SHA `0ea33e1049b122db9bdfc518032cb2c84777d267`, reports 58/58 source and 16/16 smoke PASS with locked builds; classifies behavioral Firebase, provider, live deployment and safety as blocked.
- `1HfN5oJpwauIykzbyrpCeZQ9OHGSjP2rKt0JxB0E71fY`, **FINITE TIME Film Foundry — Canonical Production Authority**, July 21; 18,072 readable characters. Canonical private source/right boundaries and phased film-foundry plan, not completed rendered/mastered/released feature.
- A Drive search for Storytime returned 100 visible hits but this pass only fetched these 3 relevant documents, did not page through all Drive and did not raw-byte verify Google Docs/attached media. Preserve this limitation.

## 5. R915 CI / source certification receipt

- Storytime R914 PR #112 at `7360f85606397744ab26618fc3ac54d0ff3ea9e5`: CI `42564832257`, Verify `42564832181`, Visual `42564832244`, **all FAILURE with no executed steps and no runner assigned** to failing jobs; native Firebase job SKIPPED. These are job states, NOT evidence Storytime code tests executed.
- Jobs private delivery PR #170 at `d379debb757a405b8757aa244e8bb87dfb574e37`: 17 workflows reported failure on current exact head; inspected CI `39489362588` and Runtime CI `39489362641` jobs show zero steps and blank runner; Callable emulator was skipped. There are two `COMMENTED` GitHub Advanced Security reviews, not approvals. Do not call current Jobs #170 acceptance green.
- Historic Storytime PR #96 exact SHA `31cf72a01b65667de89c9ad565b6f0a4e51759a0` has successful CI/Verify/Visual synthetic disposable evidence, but changed heads invalidate inherited success.
- R915 itself executed **no** native app/Functions build, emulator, physical browser/device or real provider. Its evidence is direct source semantics, current PR/CI metadata, old Drive text and preserved earlier test receipts. No private media or stored user content was accessed.

## 6. Additional cross-service release matrix

| Boundary | Current state | Required P0 proof |
|---|---|---|
| Storytime original memory selection | Typed `memory_snapshot` and Life Movie model; no authenticated actual source resolver verified | Immutable captured source identity/hash, owner+participant and purpose-specific Privacy grant |
| Storytime narrative generation | Built direct-input generator, revisions and moderation, creative derivative label | claim-by-claim recorded/recollection/generated distinction; contested claim uncertainty |
| Generation concurrency/spend | R912 per-owner transaction guard under draft PR #110; no trusted issuer/unlock | provider charge reconciliation, signed clearance with expiry/revocation, two-device emulator |
| Storytime → Jobs create | Matched general schema and owner/job idempotency source | real paired cross-project auth, consent issuer and provider/worker admission |
| Storytime → Jobs playback | **Mismatch with Jobs main**; PR170 matching descriptor in unmerged draft | rebase and real protected descriptor/endpoint acceptance |
| Storytime → Jobs private deliver | **Jobs main has no deliver**; PR170 draft has it | no raw Storage URL to browser; exact head streaming with revoke mid-chunk |
| Storytime → Privacy | local source consent receipt/Job purpose block | canonical signed recorded-source grant validated in receiving Jobs and current revocation |
| Jobs private audio deletion | PR170 PENDING access fence and conditional object delete in source | live GCS generation, post-revoke denial, failed partial delete, provider/backup purge ack |
| Studio / Asset Factory | hard-off envelope/prod proof required | approved rights/asset license/actual output provenance and spend limits |
| Content | Source registry includes Storytime, contract runtime edge RED | deployed health/version/receipt and publication policy |
| Spatial/Replay | Versioned hard-off manifest, Tier2 governance | authorized Focus/Replay real bytes and physical accessibility acceptance |
| Production infrastructure | Storytime .firebaserc placeholder; Jobs deployment not identified | effective Firebase project IDs, Auth/IAM, Hosting/Functions revisions, Storage rules and rollback |

## 7. P0–P3 closure backlog and safe execution plan

**P0:** restore exact-head real runner and full original tests/builds; identify deployed provider source/target; conduct two-repo disposable Auth/Firestore/Functions/Storage acceptance for private audio create, stage, descriptor, proxy deliver, cancellation, purpose block, owner A/B, forged consentReceiptId, stale source, revoked token mid-stream, ambiguous remote job response, GCS generation swap, and purge. Fix mismatch via independently reviewed Jobs PR #170 source, not a silent production bypass. Build a cryptographically trusted Privacy original-asset/source-purpose grant and Jobs receiver verifier. Reconcile all older provider charges and issue only authorized R912 clearances. Obtain independent approvals and AAA+++ visual/device release gates.

**P1:** claim-level source-to-story proof and immutable correction/dispute ledger, owner-safe old whyGenerated migration, family/voice likeness and public-sharing safe derivative tests, inclusion of older requests beyond R911 latest 12.

**P2:** full screen reader, keyboard, reduced-motion, captions, actual iOS/Android/Windows and physical device acceptance; qualified guardian/third-party/child law and native 19-language review.

**P3:** complete raw-byte SHA256 verification of reachable old Git/LFS/removed commits, all private external asset permissions and provider/backup runtime receipts, full nested Google Drive history and exact deployed revision provenance.

Retain existing R913 inventory **383 tracked files, 2,083,982 Git-reported bytes**, corrected source tree object `c0745b9d85e5939746ee2b505fb206b53b2cb1d4` from R914. Do not pretend that is full raw-byte or external asset content verification. R915 avoids re-inventorying unchanged source.

## 8. Next Chalk cross-chat continuation directive

Continue ONE URAI GENESIS Storytime from R915. Open this R915 cross-service report and its JSON trust ledger, then R914 independent SHA/CI erratum, R913 master 14-section report and 383-file inventory, Storytime worker PRs #83/#96–#112 and private Labs Genesis #262. Refresh all PR/Jobs heads. Reconcile Storytime `playback.delivery` and `action:deliver` with the **unmerged Jobs #170** source; Jobs main does not implement them. Do not enable or expose public GCS URLs as a workaround. Require real paired emulator and signed canonical source-specific Privacy consent, current revocation and provider settlement. Maintain every independent worker PR, do not merge/deploy/spend/touch actual private memories, and keep production **HOLD**.

**Decision:** major source and historical work built, current integration incomplete, source-contract mismatch documented, no production certification. Storytime ≠ finished live multi-service reconstruction and Replay.
