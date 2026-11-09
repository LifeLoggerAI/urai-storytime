# R903 StorytimeHome private form, autosave and generation auth fence

**Status:** source-level guard committed; **STATIC CONTRACT 9/9 PASS; NATIVE TESTS NOT RUN; PRODUCTION HOLD**.

## Source ancestry
- Exact parent: Storytime PR #101 `598c969fe4a258331c442692887903bacadf42fa`; original engineering source PR #97 `312240f5da9042a2cc9d11dac179bed90dee51d1`.
- Isolated review branch: `review/chalk-storytime-home-auth-fence-20261107`. No edits to #83/#96/#97/#99/#100/#101 or main.
- Changed StorytimeHome.tsx blob `4c65137273ec09f39bfffe520bc5cc9018f08bc8`. Reuses the existing PR #101 `current-account-lease.ts` blob `f5e4ff2472265734a22fec59b0a1c7c33065351c`.
- New source-contract regression test `tests/e2e/storytime-home-auth-fence.test.mjs` blob `595bb6120ee94aca0e0f4cc8ca0a0d3b6a2b3ea1`.

## Confirmed source-level issue
The old `StorytimeHome.tsx` skipped its entire `onAuthStateChanged` subscription unless the URL had `?draft=`. The create form could retain previously typed `sourceText`, title, theme, consents and draft metadata after a signout and new account login in a shared mounted browser. Pending `saveStoryDraft` after its `await` unconditionally wrote `draftId`, `draftRevision`, autosave status and fingerprint back to React state; draft deletion and successful generation also unconditionally handled results/navigation after a changed actor. That could reintroduce an old account's metadata or navigate under a newly signed-in account. **No production exploitation, private data exposure or actual generated personal story verified.**

## Focused remedy
- Keep a Firebase Auth listener on every cloud-ready create form, whether or not the draft query parameter is present. Query-parameter validation now happens *inside* the authenticated callback.
- Clear source text, form identifiers, user assertion, draft storage consent, story-generation consent, provider-processing consent and review fingerprint whenever the actor changes.
- Bind saved state to exact Firebase User object, not merely UID; capture auth notification epoch in `authEpoch` and check the reusable `captureStorytimeAccountLease`.
- Guard autosave before dispatch and after the awaited response, including stale catch/finally. Guard delete after await. Guard generation after provider callable, optional old draft cleanup and destination navigation.
- Immediately mask sensitive form rendering while the SDK's current actor differs from the state/actor captured on the page. Signed-out and startup states use a blank form after auth callback.
- Preserve all API payloads, source length limitations, separate consent scopes, provider/spend behavior and semantic labels. No new paid calls, private media, Firebase rules, external APIs or production deployments.

## Verification performed
Source text read directly through connected GitHub on exact review head. Nine independent static invariants checked: listener with no draft param, actor epoch, source/consent reset, post-await autosave, post-await delete, post-await generation, ready-render actor barrier, four committed test cases, identity-sensitive lease. **9/9 static checks PASS**; this is not a native runtime test.

The new `tests/e2e/storytime-home-auth-fence.test.mjs` contains four Node test cases, including a pure lease negative using a new Firebase User object with the same UID. Tests have NOT executed on original source. Local GitHub clone fails DNS for github.com, and GitHub Actions currently report early failed runner jobs without usable execution logs. No original-source Node 22 npm install, lint/TypeScript typecheck, Next build, real Firebase Auth/Firestore emulator, or browser multiactor result was obtained. No provider spend authorized.

## Remaining risk / acceptance
A request **already accepted by the Firebase callable** cannot be retroactively cancelled by a client-side actor lease. This patch prevents stale client UI mutations and navigation, not remote processing or provider charges after dispatch. Real owner/server revocation, consent generation/deletion fences and provider processing remain P0.

Required next: exact-head native Node 22 tests/typecheck/Next+Functions builds; actual browser two-actor switch while form has sensitive text, queued autosave resolving after switch, same-UID new User object, signout during provider generation, stale error/finally, autosave under account change, DeleteDraft after switch, and no navigation to another owner's Storytime session. Also verify normal draft resume, continued autosave and story creation under unchanged actor to avoid regressions, plus accessibility and reduced-motion.

**Recorded-source evidence, family recollection and AI-generated creative interpretations remain separate.** Editing/creating a story is never an authorization to read actual UrAi recorded-memory assets. Production HOLD.
