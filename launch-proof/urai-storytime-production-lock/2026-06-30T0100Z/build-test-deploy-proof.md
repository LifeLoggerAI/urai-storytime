# Build, test, and deploy proof

## Command execution status

This pass used GitHub connector inspection and contents API writes. It did not have a checked-out local repo with dependency installation and Firebase credentials available, so no local command is claimed as run.

## Commands that remain required

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run test:env-template
npm run test:security-rules
npm run test:emulator-scaffold
npm run test:emulator-runtime
npm run test:provider-wiring
npm run test:production-config
npm run test:production-evidence
npm run test:production-smoke
npm run test:production-readiness
npm run build
cd functions && npm install && npm run build
```

## Scripts verified from `package.json`

- `build`: `next build`
- `lint`: `npm run typecheck`
- `typecheck`: `tsc --noEmit`
- `test`: Node unit/e2e tests
- `test:smoke`: `node tests/e2e/smoke.test.mjs`
- `emulators:test`: Firebase emulator exec for Auth/Firestore/Storage
- `deploy:staging`: build + production config validation + Firebase deploy
- `deploy:production`: build + release-promotion validation + Firebase deploy

## CI status

- Combined status check for current pre-pass `main` returned no statuses.
- Workflow runs for current pre-pass `main` returned no workflow runs.

## Firebase target status

- `firebase.json` is present and production-shaped.
- `.firebaserc` still contains placeholder `REPLACE_WITH_URAI_STORYTIME_STAGING`.
- Therefore Firebase deployment readiness is BLOCKED.

## Live URL/deploy proof

No live staging/production hosting URL, deployed commit, DNS/SSL proof, callable smoke proof, or rollback proof was verified in this pass.

## Build/test/deploy verdict

BLOCKED FROM READY. Source scripts exist, but no executed validation receipts exist in this pass and Firebase target is still placeholdered.
