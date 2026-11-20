# ONE URAI GENESIS R1601 — signed Family Stories + deletion fences + regression convergence

**Review-only source convergence; RELEASE HOLD/NO-GO; private-memory writes OFF.**
This record distinguishes the **exact tested implementation commit** from the subsequent documentation-only commit created by adding this file.

## Published source custody
- Repo `LifeLoggerAI/urai-storytime`, draft [PR #120](https://github.com/LifeLoggerAI/urai-storytime/pull/120).
- Exact published implementation commit `cc0baee8a4b2bafc452b3e097b1f8770227d4cb7`.
- Exact Git tree `61ed8d6c784a5ca2d1733b19173b1709d403e6f0`.
- Ordered parent commits: [#119](https://github.com/LifeLoggerAI/urai-storytime/pull/119) `ecabf46ed5c2de8e24d6719b08a493a5d1d006b8` and [#117](https://github.com/LifeLoggerAI/urai-storytime/pull/117) `33fc5e6287ed457e0950b1b8ee8349cdefe2595b`.
- Manually resolved **one** conflict in `functions/src/family-story-sharing.ts`; retained both parents' unique controls. Actual local staged tree SHA matched the tree constructed through the GitHub API **exactly**. Published commit was fetched back from GitHub and verified with the exact two parents and identical tree, before retesting.
- Changes against #119 are only seven paths: two historical evidence docs, the signature verifier, reconciled sharing handler, existing unit/emulator test extension, synthetic local emulator runner and 4-emulator HTTP integration test. Package manifests, lockfiles, deployment settings, real canonical Privacy registries, Firestore/Storage Rules, Jobs, mainline and nonfamily runtime source are not changed.

## Combined source protections (not independently certified release)
- Real Firebase Auth verified-current source owner and recipient; owner/recipient deletion tombstone checks; account disable and source owner email verification checked before and after projection; strict provenance scalar labels.
- Exact-source/recipient version, one-story approved title/summary SHA-256, consent epoch, status, expiry and revocation checks.
- Ed25519 signature verification using exact pinned issuer key ID and SPKI public key; missing, forged or modified receipt rejected, without minting any real Privacy consent. The canonical registry still does **not** approve `storytime.family_share`.
- Family-membership claims never grant access; raw recordings and photographs are denied by the reviewed Storage Rules; no signed media URL or raw source field returned.
- `STORYTIME_FAMILY_SHARING_ENABLED` is **OFF by default**. Only disposable local synthetic emulator runner temporarily enables the callable boundary.

## Source-pinned execution — existing Runpod CPU pod `vxmo8gjblvsvxg`
- Node 22.23.5, reused Java 21, frozen existing dependencies. No new worker or GPU provisioning.
- Exact published commit was checked out detached with clean **tracked** status after remote fetch and tree comparison.
- **Web TypeScript** `npm run typecheck`: exit 0, SHA256 `fd099a115a850bbf7f507245c53516be3710c4ba0e69ac48bc227fbd9e9f0503`.
- **Functions build** `npm --prefix functions run build`: exit 0, SHA256 `c15a93f1cee1b0c82e92a3d8300c940c20bb7764b99b75dc452557925798facb`.
- **Full root Storytime regression** `npm test`: **664/664 PASS, 0 fail, 0 skip, exit 0**, exact *published checkout* SHA256 `6e6df482acc5af0698349c49c67b9faf9c5783235f34d3ce65b1aa023af2e104`. Before publishing the identical tree, independent staged execution also 664/664 PASS, log SHA256 `c1efb3db1d3f7fe834a1961cc44c10f69a55aff83904698e7d2e6f41de6a6534`. These are repeated runs of the same suite, **not** additive test totals.
- Actual Firebase **Auth + Functions + Firestore + Storage** disposable emulators, seeded synthetic actors and ephemeral synthetic signing key: **31/31 named scenario checks PASS, 0 FAIL**, runner `family-r1591-run.exit=0`, JSON report `pass:31,fail:0,canonicalPrivacyIssuance:false,rawMediaDelivery:false,globalDeletionComplete:false,production:HOLD,privateMemoryWrites:OFF`. Exact published checkout log SHA256 `f222d8e76259a66dd94ca8e2ac526d7f9f7083621220f87bc2dcacee54b4ab6d`. An extra default-off preflight line brings the console's `PASS ` line count to 32; the actual suite reports **31 scenario checks**.
- Full sequential Firebase Rules suite against byte-identical staged published tree: **26/26 PASS, exit 0**, log SHA256 `f4c15e52a1d4367646d1d68a729477de0738aa275d3d633d1efcffc550c0257b`. This Rules suite was not rerun after the remote checkout, but tree integrity confirms same source.

### Grandma Ashpole / Mom is the intended real UX, not a real-media test
The tests use **synthetic Grandma and synthetic Mom accounts** and fake photos/recordings only. The actual positive HTTP path permits Grandma's one **approved textual projection** to Mom, denies outsider/other story, and checks deletion fences, disabled owner, unsigned/forged/altered Privacy-looking receipts, raw media deny and grant revocation. No actual Grandma Ashpole account, private recording, voice, photo, consent receipt or family invitation was created or used.

### Remaining external launch gates
1. [Privacy #334](https://github.com/LifeLoggerAI/urai-privacy/issues/334) owner decision: register/approve or reject `storytime.family_share`, including explicit granular recipient consent, guardians, third-party subjects and lifecycle.
2. [Privacy #335](https://github.com/LifeLoggerAI/urai-privacy/pull/335) offers review-only **20/20 native signed-wire compatibility**, but is **not** a canonical signer/issued consent, KMS/IAM approval or integrated owner-positive Privacy→Storytime acceptance.
3. Jobs narrator generation deletion [#516](https://github.com/LifeLoggerAI/urai-jobs/pull/516) is fail-closed **HOLD**, with separate #517/#521 convergences. Positive `ifGenerationMatch` generation-safe audio deletion is not yet proven.
4. Real voiceover purpose/delivery, cloud broker/GCS IAM, export and physically completed deletion, hosted real Firebase user, visual/mobile accessibility, protected CI and independent owner/security GO remain open.

No production Firebase/GCS/Vercel deployment, GitHub protected-branch merge, signing key provisioning, external network grant, real personal media, or additional compute cost in this review. Raw logs preserved on existing Runpod pod under `/workspace/r1586-forward/custody/r1601-storytime-family-signed/` and `/tmp/urai-r1601-exact-published-regression.log` (local worker retention, not independent durable log archive).

**PRODUCTION HOLD / NO-GO. PRIVATE-MEMORY WRITES OFF.**
