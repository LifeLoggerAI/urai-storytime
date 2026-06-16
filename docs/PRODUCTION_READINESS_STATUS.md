# Production Readiness Status

## Branch

`implementation/firebase-readiness-scaffold`

## Summary

URAI Storytime now has repo-side production-readiness controls for CI, release promotion, Firebase runtime evidence, emulator scaffolding, provider wiring, analytics consent, monitoring/alerting, smoke validation, deployment readiness, rollback readiness, and final external blocker tracking.

The repo must not be marked production-ready until the external evidence gates pass in CI/release promotion.

## Implemented Repo-Side Controls

### CI and Release Governance

- `.github/workflows/ci.yml`
- `.github/workflows/release-promotion.yml`
- `scripts/validate-production-readiness.mjs`
- `scripts/validate-production-evidence.mjs`
- `scripts/validate-production-smoke.mjs`
- `scripts/validate-provider-wiring.mjs`
- `scripts/validate-emulator-scaffold.mjs`
- `scripts/validate-emulator-runtime.mjs`

### Firebase and Security

- `firebase.json`
- `.firebaserc`
- `firebase.emulators.json`
- `firestore.rules`
- `storage.rules`
- Firestore rules tests
- Storage rules tests

### Runtime Boundaries

- Firebase adapter boundary
- live persistence disabled-by-default boundary
- auth/admin/moderation boundaries
- privacy request/job scaffolds
- analytics adapter
- monitoring/alerting adapter

### Operational Documentation

- `docs/FIREBASE_RUNTIME_VERIFICATION.md`
- `docs/PRODUCTION_RELEASE_GATE.md`
- `docs/PRODUCTION_SMOKE_CHECKLIST.md`
- `docs/FINAL_PRODUCTION_BLOCKERS.md`
- deployment and rollback runbooks
- release evidence log

## Required Evidence Variables

Production promotion is blocked unless all of these are supplied through CI secrets/env vars and backed by real evidence:

- `URAI_FIREBASE_PROJECT_ID`
- `URAI_FIREBASE_STAGING_TARGET`
- `URAI_FIREBASE_PRODUCTION_TARGET`
- `URAI_FIREBASE_AUTH_VERIFIED`
- `URAI_FIRESTORE_VERIFIED`
- `URAI_STORAGE_RULES_VERIFIED`
- `URAI_DEPLOY_VERIFIED`
- `URAI_SECRETS_VERIFIED`
- `URAI_BILLING_PROVIDER`
- `URAI_LEGAL_APPROVED`
- `URAI_PRODUCTION_URL`
- `URAI_SMOKE_TEST_VERIFIED`
- `URAI_SMOKE_TEST_EVIDENCE_URL`
- `URAI_ANALYTICS_PROVIDER`
- `URAI_MONITORING_PROVIDER`
- `URAI_ALERTING_PROVIDER`

## Current Classification

### GREEN

- Repo-side production governance
- CI/release promotion control structure
- Production evidence gating
- Production smoke gating
- Analytics consent behavior tests
- Monitoring/alerting behavior tests
- Live persistence disabled-by-default tests
- Admin authorization tests
- Firestore/Storage rule architecture
- Emulator scaffold/runtime validation entrypoints

### YELLOW

- Full emulator runtime execution
- True Firebase emulator verification
- Production monitoring provider wiring
- Production alerting provider wiring

These remain YELLOW until CI demonstrates runtime execution with the Firebase emulator and provider evidence variables are supplied.

### RED

External operational evidence is still required for:

- verified Firebase project
- verified staging target
- verified production hosting target
- live Firebase Auth
- live Firestore persistence
- storage runtime verification
- production deploy verification
- secrets verification
- billing integration
- legal/privacy approval
- production smoke evidence

## Final Rule

Do not declare URAI Storytime production-ready unless release promotion passes and every required evidence variable is backed by a real, reviewable artifact.
