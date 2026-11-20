# R1586 Family Stories — source-owner revocation and exact-text protection (2026-11-19; local run observed Nov 20 UTC)

**Status: DRAFT/HOLD; no merge, production deploy, real family data or private writes.**

## Source identities
Repository: LifeLoggerAI/urai-storytime
Review branch: review/r1586-family-story-named-grant-policy-hold-20261119
Tests executed on exact GitHub head: `444ab3a0eafa6137bd7bad72e652f69fbeb95829`
Git tree: `92ee40a32050c3621c6ff298bfb6f28e6be44522`
Predecessor head: `951b4994788c46cfb6447f8e5a76772ba71f52cd`
Draft PR: https://github.com/LifeLoggerAI/urai-storytime/pull/117

## Source change
1. Review-only Firebase Functions `grantFamilyStoryView` validates the exact owner-approved title and chapter summary by a SHA256 of source/owner/session/version/title/summary. An existing purported `storytime.family_share` consent receipt now must match `approvedProjectionSha256`; the server-created named grant retains the digest. `getFamilyStoryView` recomputes and compares the digest before returning any text. Editing text after share grant **fails closed** even if `currentVersionId` remains unchanged. No new read right to recordings or photos.
2. `getFamilyStoryView` now checks the original owner's current Firebase Auth account `disabled` and `emailVerified` status both before and after the asynchronous Firestore transaction. A still-active recipient grant alone cannot outlive owner disable.
3. The disposable Firebase Auth emulator test includes post-grant chapter edit denial and source-owner disable denial; restoration of test state is scoped to disposable synthetic accounts.

## Executed evidence
Existing Runpod pod: `vxmo8gjblvsvxg`; Node v22.23.5; Java 21 JRE; Firebase project `demo-urai-family-r1586`; real local Firebase Auth token minting and Admin SDK token-revocation checks, Firestore transactions, Storage emulator rules; synthetic emails, stories and fake Privacy receipt only.

- Exact head `444ab3a...`: `npm --prefix functions run build` **PASS exit 0**; log SHA256 `c15a93f1cee1b0c82e92a3d8300c940c20bb7764b99b75dc452557925798facb`.
- Exact head `444ab3a...`: Auth/Firestore/Storage emulator callables `node --test tests/rules-emulator/family-auth-callable-emulator.test.mjs` **1/1 PASS exit 0**; log SHA256 `6d2ade9b7682b4ce686874f42bf37d56e1df1618b55fdae6b998fe7ec764905f`. This covers (within the single test) one granted summary, ungranted second story denied, unrelated user denied, forged grant denied, changed approved summary denied, disabled original-owner account denied, revoked fake Privacy receipt denied, explicit share revocation denied and replay by old receipt denied.
- Prior exact head `b487270...` (identical rules and earlier Functions except current owner-status check): sequential complete Firestore/Storage rules suite **26/26 PASS**, log SHA256 `97270a5463c93d43f5e8565a3d287bcc3d24821b5ca99809c232bb2f8ba3089d`. Do not transfer this all-rules result as a newly rerun exact current head; changed current head only affects Functions and auth test.
- First failed attempt with config file under `/tmp` was rejected before any tests because Firebase relative-rule paths resolved under `/tmp`; preserved log SHA256 `407c047324d6e64df536f1c7307e51263bea96d6e0bd05b6c6f`. Corrected by placing isolated config in repository, **without changing production configuration**.

## Hard boundaries
- This is **emulator acceptance, not current operational Privacy attestation**. A test fixture seeded an unsigned, canonical-looking consent receipt; `issuedBy` field and SHA256 digest do not authenticate the actual Privacy issuer. Canonical purpose registration, signed receipt transport, current owner-wide revocation and restricted writer/IAM proof remain OPEN.
- `STORYTIME_FAMILY_SHARING_ENABLED` must remain OFF outside isolated tests; no real media delivery, client share UI, IAM modification, hosted login, provider charge, or production release.
- Legacy broad family-scope `stories` and `storyRuns` Firestore rules and any Storage client migrations need separate compatibility and security review.
- Storytime voiceover `storytime.voiceover` canonical purpose and Jobs narrated-audio private `deliver` path remain unverified; Jobs narrator deletion needs generation-bound `ifGenerationMatch`, g1→g2 interleaving, and no false deletion COMPLETE before real voice or original recordings.
- Original 38 baseline Storytime root-suite failures and protected CI remain unresolved. No merge/GO.

## Next bounded execution
Authenticate canonical Privacy receipt issuer, purpose and real revoke/ACK; replay this named-grant test with actually emitted Privacy events in disposable multi-service emulators; independently test owner-wide deletion, disable/re-enable, changed story and audio g1→g2 races, then approved same-source protected staging. **PRODUCTION HOLD / NO-GO; PRIVATE-MEMORY WRITES OFF.**
