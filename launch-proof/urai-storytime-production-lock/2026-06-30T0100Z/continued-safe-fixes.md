# Continued safe fixes

## Timestamp

2026-06-30T0135Z

## Additional fixes completed

1. Updated `scripts/validate-production-readiness.mjs`.
   - Replaced stale required artifact list with current URAI Storytime source artifacts.
   - Validates current app routes, Storytime components, Firebase config, rules, Functions source, provider source, tests, workflow, and proof folder.
   - Keeps Firebase placeholder and runtime readiness as warnings/blockers instead of pretending external deployment proof exists.

2. Updated `scripts/validate-emulator-scaffold.mjs`.
   - Replaced stale `firebase.emulators.json` requirement with the actual `firebase.json` emulator config used by this repo.
   - Verifies Auth, Functions, Firestore, Storage, Hosting, and UI emulator sections exist.

3. Updated `scripts/validate-emulator-runtime.mjs`.
   - Replaced stale `firebase.emulators.json` requirement with `firebase.json`.
   - Verifies required emulator ports exist for Auth, Functions, Firestore, and Storage.
   - Preserves the warning that behavioral emulator tests are still required before production.

4. Updated `scripts/validate-provider-wiring.mjs`.
   - Replaced stale analytics/monitoring provider check with Storytime generation provider source validation.
   - Verifies provider source, Storytime callable source, and `.env.example` contain OpenAI/provider readiness markers.
   - Does not require real secrets unless `STORYTIME_GENERATION_PROVIDER=openai` is explicitly enabled in the environment.

5. Added `tests/e2e/production-boundaries.test.mjs`.
   - Locks cloud creation behind auth, cloud mode, consent, provider readiness, and safety checks.
   - Locks OpenAI provider claims behind provider/key/model gates.
   - Verifies the generation persistence bundle writes expected private Storytime records.
   - Verifies public sharing uses redacted safe fields and supports owner revoke.
   - Verifies voiceover/export remains queued job records only, not completed artifact claims.
   - Verifies Firestore/Storage private-by-default and revoked-share boundaries are present.
   - Verifies demo routes and runtime readiness preserve the non-production launch boundary.

6. Added `docs/STORYTIME_EMULATOR_BEHAVIOR_SPEC.md`.
   - Defines required synthetic users, records, allow cases, deny cases, and sanitized proof output.
   - Covers owner, other-user, admin, signed-out, private session, public share, revoke, quota, privacy request, audit/moderation, voiceover/export, and Storage artifact protections.

7. Added `scripts/validate-emulator-behavior-spec.mjs` and wired it into `package.json` plus `scripts/urai-production-verify.mjs`.
   - CI now checks that the emulator behavior proof spec exists and contains the required safety/privacy scenarios.
   - `emulators:test` now includes the behavior spec validator alongside static rules and emulator runtime checks.

## Expected impact

The CI verification path is now aligned to the actual Storytime repo instead of failing because of outdated filenames or unrelated provider checks. It also has explicit regression coverage for the product claims that must not be overclaimed before deployment proof exists, plus a required behavioral emulator proof spec for owner/non-owner/share/revoke/storage scenarios.

## Still not claimed

- No local `npm install` or build/test command was run in this runtime.
- No Firebase deployment was run.
- No OpenAI provider call was made.
- No live persistence/share/export proof was produced.
- No behavioral Firebase emulator test was executed in this runtime.

## Remaining hard blockers

- Real Firebase staging/production targets.
- CI run proof from GitHub Actions.
- Firebase emulator behavioral execution.
- Provider-backed generation smoke.
- Persistence readback proof.
- Share create/fetch/revoke proof.
- Export/voiceover artifact processing proof.
- Child-safety/legal/privacy approval proof.
