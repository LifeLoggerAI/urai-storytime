# ONE URAI GENESIS R1586+ — Family Stories signed Privacy-receipt trust boundary (Nov 19 Central / Nov 20 UTC)

**Status:** REVIEW ONLY / HOLD. No merge, external deployment, production key, IAM change, private data or real family media. Family sharing remains hard-off.

## Exact implementation source
- Repo: `LifeLoggerAI/urai-storytime`; existing draft PR [#117](https://github.com/LifeLoggerAI/urai-storytime/pull/117); review branch `review/r1586-family-story-named-grant-policy-hold-20261119`
- **Latest executed source head:** `d3fe96f0b2d024e29f7acb32e0065e836fa41d61`
- **Exact Git tree:** `80c38abb5d88a19803cbcc33dba82124e747e37d`
- Changes from prior reviewed Storytime implementation `444ab3a0eafa6137bd7bad72e652f69fbeb95829` add `functions/src/family-privacy-receipt-signature.ts`, gate `functions/src/family-story-sharing.ts` and strengthen `tests/rules-emulator/family-auth-callable-emulator.test.mjs`.

## Critical code correction
The prior source accepted a Firestore record with `issuedBy: "urai-privacy"` and exact owner, recipient, version, epoch, projected content digest, expiry and purpose. **Those fields were not cryptographically issuer-authenticated.** A privileged noncanonical writer could put a canonical-looking document there. The new review-only code rejects such records without a correctly formed **Ed25519 signature** over a domain-separated, explicitly ordered binary payload of:
`schemaVersion, id, userId, sourceSessionId, recipientUid, sourceVersionId, shareEpoch, purpose, policyVersion, decision, issuedBy, approvedProjectionSha256, expiresAtMs`.

Verification uses only a **pinned Ed25519 SPKI public key** and matching issuer key ID supplied to the backend via `STORYTIME_FAMILY_PRIVACY_ED25519_PUBLIC_KEY_SPKI_B64` and `STORYTIME_FAMILY_PRIVACY_ED25519_KEY_ID`. The verifier rejects missing or malformed key, noncanonical base64/base64url, non-Ed25519 key, unknown key ID, wrong exact purpose/version/issuer/status, malformed subject, corrupt expiry/epoch and bad signatures. It has **no signer**, private key, minting endpoint or fallback to unsigned fields.

Storytime's prior source checks remain in force, including Firebase Auth token re-verification and original-owner status, grant recipient/owner/session binding, source and version, **exact approved text SHA256**, share epoch, expiry, consent revoked flag and reduced title/summary only (no raw media). The Storytime family sharing flag is still **absent/false** for ordinary deployed environments. Test process enables it only while Firebase Auth/Firestore/Storage emulators are running.

## Actual existing Runpod execution — synthetic ONLY
- Existing authorized CPU pod: `vxmo8gjblvsvxg`.
- Node v22.23.5; reused Java 21; disposable Firebase project `demo-urai-family-r1586`, all emulated endpoints bound to localhost.
- The test generated **ephemeral Ed25519 test keys in memory**, set the test-only SPKI trust pin, minted three real Firebase Auth emulator user tokens, and seeded a synthetic receipt signed only by this test key. This is **not a canonical Privacy-issued production receipt**.
- Test execution of callable grant/view/revoke: **1/1 PASS, exit 0**, log SHA256 `e6525671eccc71c583ca92180ff5084f3fe8c2851c0a61cd1062e56414b78fb9`.
- The single integrated test verifies: forged 86-char signature is DENIED; correct synthetic signature is admitted; absent public key is DENIED; mismatched key ID is DENIED; modified signed recipient without resigned receipt is DENIED; normal Grandma→Mom single approved summary admitted; unrelated UID / second story denied; edited unapproved summary denied; disabled original owner denied; receipt.revoked true denied; active named grant revocation denied; old receipt cannot re-enable revoked grant.
- Fresh `npm --prefix functions run build`: **PASS exit 0**, log SHA256 `c15a93f1cee1b0c82e92a3d8300c940c20bb7764b99b75dc452557925798facb`.
- Prior signed-code head `bfaa316a95fc5a366400c33ea7f502b23d346c11` root `npm run typecheck` **PASS** log SHA256 `fd099a115a850bbf7f507245c53516be3710c4ba0e69ac48bc227fbd9e9f0503`; pure policy test **36/36 PASS** log SHA256 `2219fc38041e2cc1680d3b47bde70481339824f8dbe79a7207a93d10a351012d`.
- Prior signed-code head `bfaa316a95fc5a366400c33ea7f502b23d346c11` complete **sequential** Firebase Rules suite **26/26 PASS** log SHA256 `2e7c6df8f6db382beefa43cd2a23af5a2cb3a9fb6aa8142f30e7a29119baa31b`. Rules were not changed between that and the latest head; this is **not represented as a current-HEAD all-rules rerun**.
- Original broad `npm test` aggregate had **38 inherited failures** when compared at initial #117 parent, so full Storytime CI remains unproven.

## Actual canonical Privacy readback and serious remaining blocker
- Inspected the exact Privacy #331 head `c00094d7e6f80367eccd5a69edf9203528f33cc2`, with consent registry in `functions/src/consent-decision.ts` in existing Runpod checkout.
- The canonical purpose registry currently includes `memory.storage`, passive context, location, sensitive inference, biometric identity, personalization, export, research and anonymized monetization, but **does not register `storytime.family_share`**. The separate `functions/src/consent-policy.ts` registry also lacks it.
- **No canonical Privacy-issued family-scoped signed receipt exists or has been generated by these changes.** A Storytime local synthetic verifier and in-memory synthetic signer cannot unilaterally authorize a new canonical Privacy purpose, key lifecycle, IAM trust chain, consent UI, versioning or withdrawal semantics.
- This review code is therefore **not approved to enable in real staging or production**, even if signature checks succeed. Provisioning `STORYTIME_FAMILY_PRIVACY_ED25519_...` from an unapproved key would not establish real canonical authority.

## Required upstream and cross-system work
1. Canonical Privacy/legal must review/approve `storytime.family_share` as a separate, explicit purpose, scoped to owner, recipient UID, exact story, approved digest/version, epoch and expiry; register and govern the purpose.
2. Canonical Privacy must implement authenticated owner-directed consent issuance, signer-custody/KMS, key ID rotation, writer IAM, signed *current* authorization lookup and immediate owner-wide revoke/deletion propagation. Define authority of shared-state epoch and ensure no stale receipt can survive withdrawal or deletion. Publish a reviewed cross-repo wire contract; **the proposed JSON tuple is not a production schema**.
3. Replace the synthetic receipt test with an actual Privacy→Storytime native multi-emulator issuance/revoke integration. Test source-time/content edits, owner/recipient disable, expiry, deletion, reauth, signer rotation, wrong-key and stale epoch under authority changes.
4. Independent security review of previous broad `stories` / `storyRuns` family-role Firestore rules, old Storage client compatibility, real GCS exclusive writer/upload-drain/stale-writer IAM, photo/audio broker, Jobs narrator `ifGenerationMatch` generation-safe delete and `storytime.voiceover` purpose. Existing Vercel READY is different source; no same-source hosted authenticated acceptance.
5. Resolve inherited 38 Storytime aggregate test failures, protected CI, independent reviewer/owner approval, staging/store/device signoffs. Maintain no-bypass GitHub 2FA policy.

**RELEASE:** PRODUCTION HOLD / NO-GO; PRIVATE-MEMORY WRITES OFF. No external provider spend, real family audio/photos, production deployment, key provisioning or merge.
