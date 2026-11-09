# ONE URAI GENESIS — R918 INDEPENDENT STORYTIME DELETION-GENERATION FORENSICS & COMPLETE NEXT-CHALK HANDOFF

**Checkpoint:** November 8, 2026 Central. **PRODUCTION HOLD / NO-GO.** Additive, documentation-only child of [R917 Storytime PR #115](https://github.com/LifeLoggerAI/urai-storytime/pull/115); no changes to original workers, main, Firebase, Cloud Storage, provider accounts, real memories or paid media. This report records new evidence, not a source patch, runtime test or independently accepted release.

## 1. How next Chalk must orient

Read **R918_START_NEXT_CHALK.md**, then this report and **R918_NARRATOR_DELETION_GENERATION_AND_AUTHORITY_LEDGER.json**; then [R917 PR #115](https://github.com/LifeLoggerAI/urai-storytime/pull/115) full master report and proof ledger, [R916 #114](https://github.com/LifeLoggerAI/urai-storytime/pull/114) 45-case synthetic acceptance spec, [R915 #113](https://github.com/LifeLoggerAI/urai-storytime/pull/113) paired Jobs/Privacy contract, [R914 #112](https://github.com/LifeLoggerAI/urai-storytime/pull/112) corrected tree SHA, [R913 #111](https://github.com/LifeLoggerAI/urai-storytime/pull/111) complete 383-file history/source inventory, [#99](https://github.com/LifeLoggerAI/urai-storytime/pull/99) historical branches, [#106](https://github.com/LifeLoggerAI/urai-storytime/pull/106), original engineering [#110](https://github.com/LifeLoggerAI/urai-storytime/pull/110), [Jobs private-media #170](https://github.com/LifeLoggerAI/urai-jobs/pull/170), and private [Genesis Labs master #262](https://github.com/LifeLoggerAI/urai-labs-llc/pull/262). Refresh all mutable heads and reviews. Do not repeat the proven current 383-path census unless the Storytime engineering SHA changes.

As freshly rechecked, Storytime forensic PRs #99/#106–#115, Storytime engineering #110, Jobs #170 and Labs #262 are still OPEN/DRAFT/UNMERGED, with heads unchanged from R917. Storytime engineering #110 `0c3358463c7a21db97c2932ce99c8f46e2419749`; parent R917 PR #115 `685baf73e22e19c4832fa23014a7bb30e3d63133`; Jobs private delivery #170 `d379debb757a405b8757aa244e8bb87dfb574e37`. An open PR is **not** deployed, merged or accepted.

## 2. Previously established and retained evidence

- Storytime substantial original source exists: structured direct-input narratives, chapters/moments/scenes, story and narrator text, moderation, private drafts/versions, local consent and scoped deletion, guarded media envelopes, Jobs voiceover interface and historical synthetic tests.
- R913 enumerated **383 tracked files, 56 Git trees, 2,083,982 Git-reported bytes** at engineering head #110, with 77 added/40 modified/0 removed paths against main. R914 independently matched **383/383 Git path/mode/SHA-1/size** entries and corrected the actual tree-object SHA to `c0745b9d85e5939746ee2b505fb206b53b2cb1d4`. Git metadata does not mean full raw-byte SHA-256, every historical commit, LFS, private Cloud Storage or external provider media.
- R916's **45 synthetic acceptance cases remain specified, not run**. Storytime R917 PR #115 exact-head CI `42569404150` Verify, `42569404134` CI, `42569404116` Visual all completed FAILURE; failed jobs showed **zero executed steps and empty runner**, while native disposable Firebase and production-only gates skipped. Submitted review list empty. That is not native source test failure or a passed emulator.
- Jobs PR #170 current head has observed failed no-step CI and two COMMENTED reviews, not approval. Which source is deployed and what IAM/storage generations exist are still unknown.
- Canonical Privacy main lacks `storytime.voiceover` purpose and its API rejects unknown purposes; Storytime-local consent receipt ID does not prove a signed canonical original-memory grant independently checked at Jobs.
- Storytime requires protected `playback.delivery` and Jobs `action:deliver`; Jobs **main** does not support it and returns signed GCS URLs. Jobs **PR #170**, unmerged, contains matching descriptor/streaming source.
- R912 per-owner new-generation lock has no audited legacy/provider charge-clearance issuer or unlock; a missing ready guard denies all NEW generation. Do not fabricate clearance or spend.
- A Storytime text `narratorScripts` record with `providerStatus:"completed"` is completed **text**, not generated TTS audio. A generated narrative, recorded original and attributed human recollection must remain separate evidence classes.

## 3. NEW R918 finding — narrator delete-output Storage generation race risk (P0)

Original Jobs PR #170 at `d379debb757a405b8757aa244e8bb87dfb574e37`, `functions/src/jobs/storytimeNarratorBridge.ts`, **Git blob `0729c324c4c600eb3092abbf3a2674486e257cc7`, lines 328–389**:

1. `deleteOutput` runs a Firestore transaction binding job ID, owner UID, session ID and narrator script ID; only terminal job statuses may be deleted.
2. It validates the artifact GCS path starts `storytime/{ownerUid}/{sessionId}/{narratorScriptId}/` in an allowed bucket; before GCS I/O, the job is marked `derivativeAccessState:REVOKED`, `outputDeletionState:PENDING`. This is a meaningful **access-fence safeguard**.
3. It then executes `getStorage().bucket(...).file(...).delete({ignoreNotFound:true})` **without `ifGenerationMatch`** or an immutable generation check. The later transaction verifies the job's *stored path* equals the earlier path and marks deletion COMPLETE; it does not establish that the same Storage generation was deleted.
4. With a concurrent same-path object replacement after the fence, a deletion of an unpinned current object could target a different object generation. Actual exploitability depends on writer IAM, bucket/object lifecycle/versioning and runtime scheduling, none of which have been inspected here. **This is a source-confirmed race risk, not proof another user's media was deleted.**
5. In the SAME Jobs draft, `functions/src/jobs/privateMediaDelivery.ts`, **Git blob `2261b2f2bc315c2fa6935890af5294f553c0474a`, lines 35–56**, implements a *different* `deleteOwnedLifeMovieArtifact` helper that reads GCS metadata and owner/job markers and uses `file.delete({ignoreNotFound:true, ifGenerationMatch:generation})`. Narrator `deleteOutput` does **not** call it. That helper's existence cannot be counted as protection automatically inherited by narrator deletion.

### Required independent correction and proof

An authorized Jobs worker should create an **isolated review branch**, not edit deployed production, to bind narrator artifacts to immutable generation and owner/job provenance at output admission, use generation-conditional GCS delete, and leave REVOKED/PENDING (with explicit reconciliation) on 412/mismatch/unknown generation or changed source. Handle retries, idempotency, failed remote deletion and no false COMPLETE. Do not blindly reuse life-movie-specific metadata requirements if narrator TTS outputs do not carry those markers; verify actual writer/source fields first.

Minimum synthetic race test: create owner A narrator job with artifact path X generation g1; pause after deletion's PENDING fence; write replacement X generation g2; resume deletion for g1. Assert g2 remains intact, no false COMPLETE is issued, playback remains denied under PENDING, and cleanup can only proceed through scoped reconciliation. Also cover wrong owner/job metadata, 404, 412, consent revocation during stream, canceled job, repeated deletion, output path swap, and failed Storage API. Use disposable Firebase/Cloud Storage emulators or tightly controlled synthetic object fixtures—not private media or billable production.

## 4. NEW R918 owner deletion-fence semantics (policy, not automatically vulnerability)

Jobs `functions/src/jobs/privateMediaDelivery.ts`, lines 15–29, tests **only existing** `uraiPrivateLifeModelOwnerFences/{ownerHash}` and `privacyDeletionTombstones/{ownerUid}` documents for correct `deleted:false` / `active:false` fields; absent documents alone do not throw. Original `scripts/private-media-download-authority-smoke.mjs` blob `4dc4e6f4d1f7182c68c8cdbad51240391e126242` explicitly exercises successful delivery with absent fences and denies malformed or active existing fences. This may be an intentional **absence means no recorded deletion** policy, not a bypass by itself. It is still separate from affirmative signed original-source consent, which remains unverified.

Next worker must document authoritative tombstone provisioning/absence behavior, migration for legacy owners and race between missing→present ACTIVE while stream is underway. Test consent grant separately from deletion block; neither substitutes for the other.

## 5. Test coverage: preserve exact evidence types

R918 direct readbacks verified **16/16 targeted static source invariants** across original Jobs narrator bridge, shared media helper, private-media streaming smoke, narrator consent tests and separate life-movie deletion smoke. No byte execution, npm/PNPM install, native code tests, emulator, real GCS generation swap, or real provider action was executed in R918.

Original `scripts/life-movies-output-deletion-smoke.mjs` blob `9cba42ede8b1ea4bfe604caa24cfb456fda7d30a` does include `ifGenerationMatch` mismatch testing for the **separate life-movie** path. Original `scripts/private-media-download-authority-smoke.mjs` exercises **narrator stream delivery generation descriptor mismatch and revocation**, not narrator delete-output replacement; inspected narrator consent transaction suite contains no corresponding delete-generation precondition assertion. These source tests exist; their actual runtime status at Jobs PR #170 current SHA is still **not certified**.

Do not describe this as an observed production media deletion, live exploit, or complete media deletion failure. Equally, do not mark `deleteOutput` generation safe merely because a different helper and test suite are safe.

## 6. Cross-service release gates still outstanding (ranked)

**P0-A:** Actual runner and protected approval policy; frozen Storytime/Jobs/Privacy root+Functions builds, original tests and genuine two-user Auth/Firestore/Functions/Storage emulators.  
**P0-B:** Audit Jobs narrator object writer/admission metadata, implement and test immutable generation-bound `deleteOutput`, fail closed when replacement occurs.  
**P0-C:** Govern canonical Privacy `storytime.voiceover` purpose and signed source/owner/purpose/expiry/revocation grant independently verified at receiving Jobs; no fake receipt.  
**P0-D:** Accept matching private `playback.delivery`/Jobs `deliver` under approved Jobs PR #170 exact head, no signed URL downgrade; verify revocation mid-stream.  
**P0-E:** Govern real legacy provider charge reconciliation and signed clearance issuer for R912, including all historical request records beyond UI last 12; prove two devices distinct requests exactly one admission/no second provider spend.  
**P0-F:** Authenticated original memory capture/hash → attributed recollection/AI derivative claim ledger → approved Jobs/Studio output → private Spatial Focus/Replay → consent revocation and downstream Storage/provider/backup purge acknowledgment.  
**P0-G:** Actual Firebase target/hosting/Functions/storage/index/rules/IAM/App Check, legal participant/guardian rights, accessibility/reduced motion/captions, physical device/AAA+++ visual/independent review/rollback signoff.

**P1:** owner-safe misleading old source explanation remediation, disputes and corrections, receipt pagination and redacted sharing/caches. **P2:** native 19-language and blind/haptic/child policy coverage. **P3:** all raw-byte current/historical Git/LFS/Drive/cloud/provider media and unreachable/deleted commits. None is silently certified.

## 7. Explicit remaining scope limitations

R918 did not inspect actual GCP Storage versioning, current IAM writer permissions, deployed Jobs revision, live Firestore collection contents, provider invoices/charges or backlog, individual family private sources, production deletion logs, every Drive item or all intermediate Git history. Source files were accessed via GitHub connector at pinned heads; only selected original source and tests were read. Re-read every mutable ref before future actions. Do not expose internal provider secrets or personal data in handoffs.

## 8. Next-Chalk copy-ready execution directive

Continue ONE URAI GENESIS Storytime from R918. Open R918_START_NEXT_CHALK.md, R918_INDEPENDENT_STORYTIME_DELETION_GENERATION_AND_HANDOFF.md and R918_NARRATOR_DELETION_GENERATION_AND_AUTHORITY_LEDGER.json. Then read R917 full proof ledger, R916 synthetic 45-case matrix, R915 Storytime/Jobs authority contract, R914 Git tree correction, R913 383-file historical census, engineering Storytime #110, Jobs private #170, Labs #262. Refresh exact PR heads and CI. Prioritize the NEW P0 source-confirmed Jobs narrator `deleteOutput` lack of GCS `ifGenerationMatch`; patch in a separate approved Jobs review branch after confirming output writer metadata, and execute synthetic object replacement/owner/revocation/deletion negative tests. Restore protected runnable CI; also reconcile canonical signed Privacy consent, Jobs protected descriptor/deliver, R912 valid provider spend clearance, authenticated memory fact/recollection/AI provenance and protected Replay/purge. No merge, deploy, paid provider, real user memory, fabricated authorization or false release pass. **PRODUCTION HOLD.**

**R918 decision:** Real software and protections exist, but current cross-service source authority, narrator conditional deletion, signed original-memory consent, CI and complete authenticated runtime remain unaccepted. No-Go.
