# Build, test, and deploy proof

## Scripts present

From `package.json`, this repo defines:

- `npm run dev` -> `next dev`
- `npm run build` -> `next build`
- `npm run start` -> `next start`
- `npm run lint` -> `npm run typecheck`
- `npm run typecheck` -> `tsc --noEmit`
- `npm test` -> Node unit/e2e tests
- `npm run test:smoke`
- Firebase emulator/rules/provider/production-readiness validators
- Firebase deploy commands for rules, functions, hosting, staging, and production

## Static/test evidence inspected

- Smoke test file exists at `tests/e2e/smoke.test.mjs`.
- Smoke tests assert app routes, demo/cloud boundaries, auth panel, session reader, share reader, runtime gates, Firestore rules, indexes, callables, provider wiring, audit logging, deployment docs, and QA boundaries.
- Firebase config contains hosting, functions, Firestore rules/indexes, Storage rules, and emulator definitions.
- `.env.example` includes Firebase client/admin, cloud/share gates, provider, OpenAI, and Asset Factory variables.

## Commands run in this pass

No local `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, Firebase emulator, or deploy command was executed by this assistant pass because this connector session provided GitHub repository access but not a checked-out repository with dependency installation/network execution. No unsupported build/pass claim is made.

## GitHub Actions evidence

`fetch_commit_workflow_runs` for observed head `6426b5513c8db4db105b57b961037367f07cb931` returned no workflow runs in this pass.

## Deployment target evidence

- `firebase.json` is production-shaped for Firebase Hosting + Functions + Firestore + Storage.
- `.firebaserc` still contains placeholder project id `REPLACE_WITH_URAI_STORYTIME_STAGING`.
- README states verified deployment at `https://www.uraistorytime.com` is not yet verified.

## Deployment verdict

Deployment is BLOCKED. Do not claim production deployment until the Firebase project target is replaced with real staging/production project IDs, CI/build/test passes, Firebase deploy succeeds, DNS/SSL is verified, and live route/callable smoke evidence is recorded.
