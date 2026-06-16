# Production Blocker Handoff Matrix

## Purpose

This handoff turns remaining YELLOW and RED production-readiness items into explicit evidence requests. Do not mark any item GREEN until the required evidence is supplied and the release promotion workflow passes.

## YELLOW Items

| Item | Why It Is Yellow | Owner | Required Evidence | Next Action |
|---|---|---|---|---|
| Full emulator runtime execution | Repo has emulator scripts and CI validation entrypoints, but CI runtime evidence is not yet attached here. | Engineering / Jacob | Passing CI log for `npm run test:emulator` or release workflow evidence artifact | Run emulator workflow and attach log/artifact |
| True Firebase emulator verification | Rules and emulator scaffold exist, but verified runtime assertion output must be collected. | Engineering / Jacob | Emulator execution log proving Auth, Firestore, and Storage rules validation | Run `npm run test:emulator` and store evidence |
| Production monitoring provider wiring | Provider gate exists, but real provider secret/evidence is not supplied. | Ops / Jacob | `URAI_MONITORING_PROVIDER` configured in CI secrets plus monitoring dashboard evidence | Configure provider secret and link dashboard evidence |
| Production alerting provider wiring | Alerting gate exists, but real alert routing evidence is not supplied. | Ops / Jacob | `URAI_ALERTING_PROVIDER` configured plus alert route/test evidence | Configure provider secret and attach alert test evidence |

## RED Items

| Item | Owner | Required Evidence Variable | Required Artifact | Next Action |
|---|---|---|---|---|
| Verified Firebase project | Jacob / Firebase owner | `URAI_FIREBASE_PROJECT_ID` | Firebase console project screenshot or CLI project list artifact | Verify project ID and add CI secret |
| Verified staging target | Jacob / Firebase owner | `URAI_FIREBASE_STAGING_TARGET` | Firebase hosting target artifact | Verify target and add CI secret |
| Verified production hosting target | Jacob / Firebase owner | `URAI_FIREBASE_PRODUCTION_TARGET` | Firebase hosting target artifact | Verify target and add CI secret |
| Live Firebase Auth | Jacob / Auth owner | `URAI_FIREBASE_AUTH_VERIFIED` | Auth provider config and admin-claim verification evidence | Verify Auth and add CI secret |
| Live Firestore persistence | Jacob / Backend owner | `URAI_FIRESTORE_VERIFIED` | Runtime persistence smoke evidence | Verify write/read path and add CI secret |
| Storage runtime verification | Jacob / Backend owner | `URAI_STORAGE_RULES_VERIFIED` | Storage rules runtime or emulator evidence | Verify Storage rules and add CI secret |
| Production deploy verification | Jacob / Release owner | `URAI_DEPLOY_VERIFIED` | Deployment run URL/log | Deploy and attach evidence |
| Secrets verification | Jacob / Security owner | `URAI_SECRETS_VERIFIED` | Secret inventory/review artifact | Review secrets and add CI secret |
| Billing integration | Founder / Billing owner | `URAI_BILLING_PROVIDER` | Billing provider/account evidence | Verify billing provider and add CI secret |
| Legal/privacy approval | Founder / Legal owner | `URAI_LEGAL_APPROVED` | Legal/privacy approval artifact | Approve docs and add CI secret |
| Production smoke evidence | Jacob / QA owner | `URAI_PRODUCTION_URL`, `URAI_SMOKE_TEST_VERIFIED`, `URAI_SMOKE_TEST_EVIDENCE_URL` | Smoke test report URL/log | Run smoke test and attach evidence |

## Release Rule

Production promotion is blocked until all required evidence variables are present, backed by real artifacts, and the release promotion workflow passes.
