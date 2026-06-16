# URAI Storytime Deployment Runbook

## Status

Production deployment is blocked until Firebase project, hosting target, environment configuration, security rules, and smoke tests are verified.

## Pre-deployment gates

- Confirm repository: `LifeLoggerAI/urai-storytime`
- Confirm branch
- Confirm Firebase project
- Confirm Firebase hosting target
- Confirm CI is green
- Confirm build output exists in `dist`
- Confirm Firestore rules are reviewed
- Confirm Storage rules are reviewed
- Confirm rollback path is ready
- Confirm smoke test checklist is ready

## Local verification

Run:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:smoke
npm run test:e2e
npm run build
npm run preview
```

## Firebase emulator verification

After Firebase CLI is installed and project placeholders are replaced with verified project IDs, run:

```bash
firebase emulators:start
```

Then verify:

- hosting loads
- app routes render
- Firestore emulator starts
- Storage emulator starts
- Auth emulator starts

## Staging deployment

Only deploy staging from an approved branch after all local checks pass.

```bash
npm run build
firebase use staging
firebase deploy --only hosting
```

## Production deployment

Production deployment requires explicit approval.

Do not deploy production if any of these are unknown:

- Firebase project
- hosting target
- environment configuration
- security rules status
- rollback path
- CI status
- smoke test owner

## Post-deploy smoke checklist

- Home route loads
- Create story route loads
- Library route loads
- Story detail route loads
- Privacy route loads
- Terms route loads
- Safety route loads
- Mobile viewport loads
- No console errors in critical flows
- No production-only mock/demo claims

## Final deployment status

Use RED/YELLOW/GREEN.

GREEN requires passing evidence for every critical gate.
