# R909 — Storytime isolated security convergence and exact-blob test receipt

**Production HOLD / review only.** Audit date: 2026-11-08 America/Chicago. No production IAM/Firebase deployment, private user data, paid provider, child profile, cross-system consent issuance or live media operation occurred.

## Source authority and isolation

- Original engineering parent [PR #97](https://github.com/LifeLoggerAI/urai-storytime/pull/97) \`312240f5da9042a2cc9d11dac179bed90dee51d1\` (all relevant donor target files originated from that exact source).
- Isolated integration branch from [PR #105](https://github.com/LifeLoggerAI/urai-storytime/pull/105) \`c01963408da4deabcc27a98156bafcd1f7b10ab7\`. This already includes the [PR #103](https://github.com/LifeLoggerAI/urai-storytime/pull/103) generation request binding, [PR #104](https://github.com/LifeLoggerAI/urai-storytime/pull/104) atomic local final-write cancellation and [PR #105](https://github.com/LifeLoggerAI/urai-storytime/pull/105) source-signal explanation correction.
- Independent security donor [PR #100](https://github.com/LifeLoggerAI/urai-storytime/pull/100) head \`f0efee038d0acdcf8c74f4108c03c41e32bedfd1\`: server-owned generated canon Firestore Rules plus three existing Rules/source tests and its forensic report.
- Independent account-read and form donor [PR #102](https://github.com/LifeLoggerAI/urai-storytime/pull/102) head \`9be92015f1f9b42101e224aedf92807d0777cdcb\`, which includes [PR #101](https://github.com/LifeLoggerAI/urai-storytime/pull/101): current-account lease utility, SessionLibrary, DraftLibrary, StorytimeHome, native/source-contract tests, and both historical reports.
- Created a **fresh independent review branch** \`review/chalk-storytime-r909-security-convergence-20261108\` at exact #105 source and applied only **13 exact original donor Git blobs** (5 from #100, 8 from #102) via Git tree objects and a non-force fast-forward. Initial integration commit \`3c5d8b12dadc62c6faf908182221e2251870160a\`. No upstream owner or worker ref was moved. No content rewrites of those donor files.
- All seven preexisting donor target paths at #105 were byte-identical Git blob SHA-1 to #97; six other donor paths were absent. New integration tree: **369 tracked blobs, 56 directories, 2,009,027 reported bytes**. Every unchanged base file has the same Git blob identity/mode. Full machine-readable list and crosswalk: \`R909_EXACT_BLOB_CONVERGENCE_AND_TEST_LEDGER.json\`.

This establishes **source-identity compatibility for a proposed integrated candidate**. It is NOT a successful typecheck, import graph proof, Firebase Rules evaluation, live browser or deployment certification.

## Resolved source conflicts and new aggregate boundary

| Risk / previous worker | New candidate source | Proof and limits |
|---|---|---|
| Client could forge server-owned story canon and provenance | #100's **13 generated collections** allow owner/admin reads but deny all client create/update/delete; auditLogs deny any client create/update/delete | Exact Rules donor file Git SHA \`4d67e85c49f3599ef32b0eb398084442ad65c496\`, readback 14/14 protected match blocks. Real Auth/Firestore Rules emulator NOT RUN. |
| Old owner private session titles/draft metadata could settle after another Firebase actor signs in | #101's SessionLibrary/DraftLibrary actor object+auth epoch fence, new \`captureStorytimeAccountLease\` | Original helper Git SHA \`f5e4ff2472265734a22fec59b0a1c7c33065351c\`; 6/6 *new synthetic* native Node tests PASS, including same UID recreated account and stale asynchronous settlement; browser NOT RUN. |
| Private StorytimeHome \`sourceText\`, consent state, draft responses could survive account switch | #102's mounted Auth listener even without \`?draft=\`, full private-field reset and post-await actor/epoch guards | Original StorytimeHome Git SHA \`4c65137273ec09f39bfffe520bc5cc9018f08bc8\`; static source review only, complete four-test source suite and real browser NOT RUN. |
| Request ID retry could return wrong owner's/changed-input/revoked story | #103's immutable reviewed/provider input SHA check and original owner/request/approved/ready/creative-derivative proof | Original request-binding Git SHA \`ce28459340e271c108756248ae46ec95df6e3be6\`; 13/13 *new synthetic* native Node tests PASS, not real transaction emulator. |
| Local nonproduction final write might overwrite cancellation | #104 transactional cancel/request/source recheck | Exact Git blob source preserved on #105; no race emulator executed; paid output path unmodified. |
| \`sourceSignals\` explanation falsely implied original memory source and echoed labels | #105 creative reconstruction explanation avoiding raw labels and separating unverified metadata | Exact donor code retained; sourceSignals not sent to provider as authentic original media; older stored explanations still uncorrected. |

## Native isolated verification, exact bytes

Local tool had Node \`v22.16.0\`, npm \`10.9.2\`, Git \`2.47.3\`. Direct repository clone via git failed \`Could not resolve host: github.com\`. Authenticated GitHub connector was used to fetch selected original source, reconstituted exactly for **two pure helper files** and locally verified using \`git hash-object\`:
- \`src/lib/storytime/current-account-lease.ts\`:  Git SHA-1 \`f5e4ff2472265734a22fec59b0a1c7c33065351c\`, computed raw SHA-256 \`1f964ca97f059b8b9d78a44c8e5bb227f4b2fd3a4c8117b940bf92b5a18c8510\`, **6/6 R909-created synthetic native tests PASS**.
- \`functions/src/storytime-request-binding.ts\`: Git SHA-1 \`ce28459340e271c108756248ae46ec95df6e3be6\`, computed raw SHA-256 \`8a235f716ac1b13dc6ad435462d76ff22e73da563c35807ce4064df7d7e5a867\`, **13/13 R909-created synthetic native tests PASS**.
- Combined Node TAP **19 tests, 19 pass, zero fail**, digest SHA-256 \`f37063affc5dd50d1a27f27874d6ec9c154a2b45b9d385dface17378d74a9784\`. Original R909 synthetic test file hashes and individual TAP digests recorded in the JSON ledger. Source code/isolated TAP was executed locally, but **not all repository tests**.
- Direct Firestore Rules readback confirmed server-only **13/13 generated collection match blocks**, plus auditLogs, for **14/14 static write-denial checks**. This is string/source examination, not Firestore permission enforcement. SessionLibrary, DraftLibrary and StorytimeHome copies match exact original donor hashes; actor/epoch/source-reset signals are visible, but no true asynchronous React browser acceptance was run.

## Historical and new CI

- [PR #96](https://github.com/LifeLoggerAI/urai-storytime/pull/96) historical exact head \`31cf72a01b65667de89c9ad565b6f0a4e51759a0\`: CI/Verify/Visual successful October 15, 2026 and disposable emulator evidence. **Not transferable to this source**.
- [PR #105](https://github.com/LifeLoggerAI/urai-storytime/pull/105) exact head \`c01963408da4deabcc27a98156bafcd1f7b10ab7\`: CI \`42536900659\`, Verify \`42536900653\`, Visual \`42536900738\` all failed, failing jobs showed empty runner/steps; job logs returned 404 BlobNotFound. Do not claim source tests ran or caused failure. New R909 branch needs its own workflow readback.
- No frozen \`npm ci\`, exact integrated TypeScript/Next/Functions build, native original authorization test suite, four Firebase emulator acceptance, React browser, real app/source authorization or protected Jobs/Replay validation in this R909 local session. Maintain explicit NO-GO.

## Core story truth and authority preservation

**Remembered human recollection ≠ recorded source ≠ AI-generated interpretation.** The current Storytime generator uses direct submitted text/title/tone/motifs; client-supplied sourceSignals labels are not fetched/authenticated/hard-hashed original memory. Schema-level creative derivative is not per-claim factual reconstruction. Current Firebase project default is the \`REPLACE_WITH_URAI_STORYTIME_STAGING\` placeholder, not proof of live project ownership. In the separate Jobs bridge, a server bearer token and local Storytime consent receipt are not a canonical signed owner+original-source+purpose consent decision independently verified by Jobs. A generated sample, created voiceover job or completed workflow cannot establish authorized private-memory capture, licensed asset, protected playback, provider deletion or child-family legal consent. The historical locked parent-guided child StoryTime policy remains distinct from this newer adult/guardian narrative-memory system.

## P0 continuation and acceptance commands

1. Refresh original PRs and R909 commit SHA and current Actions first. Do not merge changes directly into PR #83/#97/#100/#101/#102/#103/#104/#105 or \`main\` without owner review.
2. On a trusted environment able to clone the exact R909 branch, install locked root dependencies with \`npm ci --no-audit\` and run \`npm run typecheck && npm test && npm run build\`. Use Functions Node22 and \`npm --prefix functions ci --no-audit && npm --prefix functions run build\` for Functions. Collect untruncated logs, source SHAs and exact artifact digests. No production deploy.
3. Run the **real four-service Firebase Auth/Firestore/Functions/Storage emulator**, starting from the native disposable #96 harness; do not substitute root \`npm run emulators:test\` scaffold/spec-only check for full behavior. Test owner A/B, admin and signed-out reads, all 13 generated collection and auditLog mutation denials; existing legacy family paths; stale async list/form autosave/navigation; same UID session regeneration; cancellation-versus-final-transaction; retry changed reviewed/provider hashes and old \`needs_review\`, failed, cancelled, malformed or revoked statuses.
4. Independently review backend Admin SDK IAM, original-source collection authorization, privilege and family/child role claims, source provenance mutations, current account switch negative playback, provider spend/reconciliation, Jobs token/receipt and current revocation. No real user records or paid provider.
5. Integrate canonical Privacy signed owner+source+purpose+version/expiry consent, immutable recorded source hash and source assertion class, downstream Jobs/Studio/Replay revocation and deletion with protected test fixtures. Only after this and exact-head green reviews should owner consider staging; never self-promote production GO.
6. Preserve every prior worker branch and exact original source identity. Update master private Labs registry and ChatGPT Space with R909 PR/hold and verification limits.

**Disposition:** isolated source compatibility and selected native helper behavior verified; full integrated functional, security and production acceptance **NOT VERIFIED. Production HOLD.**
