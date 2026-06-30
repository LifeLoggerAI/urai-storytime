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
   - Locks cloud creation, provider claims, persistence records, public sharing, queued export status, private-by-default rules, and demo boundaries.

6. Added `docs/STORYTIME_EMULATOR_BEHAVIOR_SPEC.md`.
   - Defines required synthetic users, records, allow cases, deny cases, and sanitized proof output for emulator behavior proof.

7. Added `scripts/validate-emulator-behavior-spec.mjs` and wired it into `package.json` plus `scripts/urai-production-verify.mjs`.
   - CI now checks that the emulator behavior proof spec exists and includes required safety/privacy scenarios.

8. Implemented default public-share expiration.
   - `createPublicStoryShare` now writes `expiresAt` using `STORYTIME_PUBLIC_SHARE_TTL_DAYS`, defaulting to 30 days.
   - The callable now returns `expiresAt` with `shareId` and `slug`.
   - `.env.example` documents `STORYTIME_PUBLIC_SHARE_TTL_DAYS=30`.
   - `scripts/validate-env-template.mjs` requires the TTL env template.
   - `tests/e2e/production-boundaries.test.mjs` now asserts public shares expire by default.

9. Added isolated Firebase production gates.
   - `.env.example` now documents `URAI_STORYTIME_FIREBASE_PROJECT_ID`, Storytime staging/production targets, Core/Analytics comparison IDs, and `STORYTIME_FIREBASE_ISOLATED=false` as a safe default.
   - `scripts/validate-env-template.mjs` requires the isolated Storytime Firebase env markers.
   - `scripts/validate-live-production-config.mjs` now requires `STORYTIME_FIREBASE_ISOLATED=true` for live production.
   - Live production config now fails if the Storytime Firebase project matches the Core or Analytics Firebase project IDs.

## Expected impact

The CI verification path is aligned to the actual Storytime repo, has regression coverage for sensitive product claims, includes an emulator behavior proof spec, makes new public shares time-limited by default, and blocks production config unless Storytime uses an isolated Firebase project.

## Still not claimed

- No local `npm install` or build/test command was run in this runtime.
- No Firebase deployment was run.
- No OpenAI provider call was made.
- No live persistence/share/export proof was produced.
- No behavioral Firebase emulator test was executed in this runtime.

## Remaining hard blockers

- Real isolated Firebase staging/production targets for Storytime.
- CI run proof from GitHub Actions.
- Firebase emulator behavioral execution.
- Provider-backed generation smoke.
- Persistence readback proof.
- Share create/fetch/revoke proof.
- Export/voiceover artifact processing proof.
- Child-safety/legal/privacy approval proof.
