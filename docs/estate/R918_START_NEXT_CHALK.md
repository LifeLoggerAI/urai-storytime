# R918 — START NEXT CHALK: ONE URAI GENESIS STORYTIME

**PRODUCTION HOLD / NO-GO.** Date: November 8, 2026 Central. This is a **docs-only, independent source audit**, not a current runnable build, real-memory processing, production deployment, or payment approval.

## Read in exact order

1. **R918_INDEPENDENT_STORYTIME_DELETION_GENERATION_AND_HANDOFF.md** — complete eight-section source forensic report of new deletion-generation race, existing safeguards, cross-service boundaries, evidence limitations and P0–P3 backlog.
2. **R918_NARRATOR_DELETION_GENERATION_AND_AUTHORITY_LEDGER.json** — machine proof: actual Jobs PR #170 source blobs, 16/16 targeted static assertions, three new findings, six retained blockers and synthetic acceptance recipe.
3. [R917 PR #115](https://github.com/LifeLoggerAI/urai-storytime/pull/115) — latest full Storytime forensic master, source-truth/text-versus-audio distinction and proof ledger.
4. [R916 PR #114](https://github.com/LifeLoggerAI/urai-storytime/pull/114) — 45 synthetic test specifications; **none executed**.
5. [R915 PR #113](https://github.com/LifeLoggerAI/urai-storytime/pull/113) — Storytime-Jobs main-vs-draft delivery protocol mismatch.
6. [R914 PR #112](https://github.com/LifeLoggerAI/urai-storytime/pull/112) — corrected tree SHA `c0745b9d85e5939746ee2b505fb206b53b2cb1d4`, 383/383 metadata matches.
7. [R913 PR #111](https://github.com/LifeLoggerAI/urai-storytime/pull/111) — exhaustive 383-path source inventory, 16-worker matrix, 14-section history and truth/owner/dependency ledger, [PR #99](https://github.com/LifeLoggerAI/urai-storytime/pull/99) older 96-branch census, [PR #106](https://github.com/LifeLoggerAI/urai-storytime/pull/106) forensic.
8. [Storytime engineering #110](https://github.com/LifeLoggerAI/urai-storytime/pull/110), [Jobs private media #170](https://github.com/LifeLoggerAI/urai-jobs/pull/170), private [Labs Genesis #262](https://github.com/LifeLoggerAI/urai-labs-llc/pull/262).

## NEW P0 — narrator object deletion race risk

Jobs draft #170 `functions/src/jobs/storytimeNarratorBridge.ts` blob `0729c324c4c600eb3092abbf3a2674486e257cc7`, `deleteOutput()` lines 328–389, fences private access as REVOKED/PENDING and validates owner/job/session/script + GCS path, **but calls `.delete({ignoreNotFound:true})` without `ifGenerationMatch`**. Post-deletion compares path only. A replacement object under the same path between fence and delete could be removed instead of the original generation. This is a confirmed **source race risk**, not a proven incident or exploitation. The separate `privateMediaDelivery.ts` helper uses `ifGenerationMatch`, owner/job markers and an existing life-movie deletion smoke; narrator does NOT invoke that helper. Fix in isolated, reviewed **Jobs** source after examining narrator writer metadata; preserve PENDING on mismatch and never issue false COMPLETE.

The existing source stream test rejects wrong descriptor generation, but does **not** prove narrator delete-output CAS. Required test: synthetic g1 job → PENDING fence → replace path with g2 → deletion of g1 must fail, g2 remain, no premature COMPLETE. Include 412, 404, wrong owner/job, repeated cancel/delete, incomplete provider/backup purge and revoked streaming. **R918 16/16 static code checks passed; zero native or emulator tests executed.**

## Other critical gates (unchanged)

- Privacy main lacks canonical `storytime.voiceover` registered purpose; a Storytime local decision ID is not signed current owner/original-source/purpose consent independently checked by Jobs.
- Storytime requires protected `playback.delivery` + Jobs `action:deliver`; Jobs MAIN lacks deliver and returns signed GCS URLs. Jobs PR #170 matches at source level but remains unmerged/unaccepted.
- R912 owner admission guard has NO trusted provider spend/legacy-clearance issuer; missing guard blocks all fresh generation. A SHA-shaped string is not payment settlement or permission.
- Actual signed original memory → attributed recollection/creative interpretation (not equal!) → authorized Jobs/Studio output → private Spatial Replay → revocation, deletion and provider/cloud/backup acknowledgement not proved.
- Protected runnable CI, independent reviewer, actual Firebase project/deployment SHA/IAM, physical device/captions/reduced-motion/AAA+++ visual gates not certified. R917 PR #115 CI/Verify/Visual failing jobs all zero steps and no runner; native Firebase skipped.

## Next execution order

**(1)** Recheck current PR heads, runner/CI, review approvals, deployed source. **(2)** Jobs separate conditional narrator deletion correction and native synthetic generation-swap acceptance. **(3)** Storytime+Jobs+Privacy signed purpose grants and genuine disposable Auth/Firestore/Functions/Storage owner A/B negative tests. **(4)** R912 verified historical-charge clearance and cross-device single admission. **(5)** Source truth and protected Replay/purge acceptance. **(6)** Independently approved protected CI, project/IAM, device/accessibility/AAA and rollback.

Do not merge, deploy, spend, rotate secrets, touch actual private memories, fabricate grants or mark documentation as runtime certification.

## Copy-ready next worker request

Continue ONE URAI GENESIS Storytime at R918. Read the R918 full report and machine ledger first, then R917→R913 forensic chain, engineering Storytime #110, Jobs #170, private Labs #262. Refresh exact SHAs/CI. Run synthetic Jobs narrator object-generation deletion race; patch the confirmed lack of GCS ifGenerationMatch in separate approved Jobs review branch only after verifying narrator artifact writer metadata. Preserve existing REVOKED/PENDING and never issue false COMPLETE. Restore real runners, prove canonical signed Privacy source-specific owner/purpose rights, private Jobs deliver, R912 verified charge clearance, true recorded-source/recollection/AI truth ledger and protected Replay/revocation/provider purge. No production edits or real private memories. **HOLD.**
