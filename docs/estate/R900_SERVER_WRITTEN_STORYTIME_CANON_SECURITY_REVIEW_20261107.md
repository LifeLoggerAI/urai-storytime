# One UrAi Genesis — Storytime server-write boundary review

**Classification:** exact-source review only, **PRODUCTION HOLD**. This is an isolated child of Storytime PR #97 (head `312240f5da9042a2cc9d11dac179bed90dee51d1`). It does not edit that source/branch, PR #83, PR #96, PR #99, main, Firebase, Jobs, Studio or paid providers.

## Reproduced source-level defect

The existing `firestore.rules` permitted an authenticated owner to `create` and `update` `storySessions`, including its `consentSnapshot`, `provenance`, `sourceSignals`, `status`, and `currentVersionId`, provided only the owner's UID remained constant and the distinct safety/moderation field names did not change. The same rules permitted owner-side mutation of `narratorScripts`, `voiceoverJobs`, `storyExports` and generated derivative records, and permitted **any signed-in user to create arbitrary `auditLogs`**. A server callable can subsequently consume a tampered record as if its authorization and narrative provenance are trusted. Real exploit, authorized provider dispatch, data exposure or deployed runtime **not proven**.

**Source test evidence:** `tests/rules-emulator/authorization-matrix.test.mjs` explicitly EXPECTED owner `updateDoc(storySessions, {title})` success while denying only owner safetyStatus changes. `tests/e2e/production-boundaries.test.mjs` expected the old limited moderation-field guard. App UI `StorytimeHome`, `StoryRevisionEditor`, `ShareControls`, `StorytimeHome` draft save/delete, private owner loader, and voiceover go through Firebase Functions for writes; direct browser Firestore operations examined were **reads only**. `src/firebase-adapter.mjs` and `src/live-persistence.mjs` are disabled scaffolds. `functions/src/audit-log.ts` currently emits structured console log records rather than user-created Firestore auditLogs.

## Safely scoped correction

1. For thirteen generated-story and job/export metadata collections, preserve owner/admin read access and deny **all client create/update/delete**. Firestore Admin SDK callables can still write through verified server identities; these rules do not grant the backend authority or protect from malicious privileged service accounts.
2. For `auditLogs`, preserve admin read but deny client creation/updating/deletion (including arbitrary signed-in actor).
3. Remove obsolete owner session moderation-only helpers and revise the old text-based production regression to assert every affected match block is server-only.
4. Change the previously positive owner-title emulator expectation to denial, and add synthetic owner/nonowner/admin/signed-out negative create/update/delete cases for every protected generated collection plus auditLogs; preserve owner/admin reads.

**Deliberately unchanged:** family and child-profile legacy rules, `users`, user preferences, append-only client analytics, current server-only drafts/versions/generation requests, current private family Storage rules, public-share expiry and revoke, Firebase project/target controls, and every runtime callable. Those other paths retain their own review obligations.

## Exact source/verification limits

No git clone or frozen npm install can be made in the local container because DNS resolution for `github.com` fails. Current GitHub Actions runners terminate within ~3s with no steps at PR #97/#99; new CI is therefore mandatory but unavailable as a test receipt. The new and adjusted tests are **committed, not executed**. No Firestore emulator or production project was called. The companion static source review verified each of the thirteen rule blocks contains the intended server-only clause before committing; this is not equivalent to a real Firebase Rules evaluation.

**Required next:** native Firebase Auth/Firestore/Storage/Functions emulator run using exact source, test all 13 owner/admin denial cases and owner/admin read positives, check child/family legacy policy, ensure every consumer uses read-only client access and fully callable-backed edits, strict next-head root npm test/typecheck/Next build/Functions compile, separate Security/Privacy reviewer approval, and provider/deletion/source consent acceptance. Do not merge without those receipts.

## Source truth policy

No real memory source, family recollection, child's data, voice, TTS provider, public sharing or real account used. No source fact is inferred from an AI derivative. A user edit remains the user's creative correction, not independent recorded fact. **PRODUCTION HOLD.**
