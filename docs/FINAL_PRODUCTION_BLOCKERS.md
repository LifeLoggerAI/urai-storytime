# Final Production Blockers

## Status

URAI Storytime has strong repo-side production-readiness controls, but it is not production-ready until the external operational blockers below are verified with evidence.

These blockers are not repo architecture gaps. They require real infrastructure, provider credentials, deployment execution, and approval evidence.

## External Blockers

| Blocker | Required Evidence | Current Status |
|---|---|---|
| Real Firebase project | `URAI_FIREBASE_PROJECT_ID` set to verified project ID | RED |
| Staging hosting target | `URAI_FIREBASE_STAGING_TARGET` set to verified target | RED |
| Production hosting target | `URAI_FIREBASE_PRODUCTION_TARGET` set to verified target | RED |
| Live Firebase Auth | `URAI_FIREBASE_AUTH_VERIFIED=true` with provider/admin-claim evidence | RED |
| Live Firestore persistence | `URAI_FIRESTORE_VERIFIED=true` with runtime persistence evidence | RED |
| Live Storage rules runtime verification | `URAI_STORAGE_RULES_VERIFIED=true` with runtime/emulator evidence | RED |
| Production deploy verification | `URAI_DEPLOY_VERIFIED=true` with deployment evidence link | RED |
| Secrets verification | `URAI_SECRETS_VERIFIED=true` with secret inventory/review evidence | RED |
| Billing integration | `URAI_BILLING_PROVIDER` set to verified billing provider | RED |
| Legal/privacy approval | `URAI_LEGAL_APPROVED=true` with approval evidence | RED |
| Production smoke evidence | `URAI_PRODUCTION_URL`, `URAI_SMOKE_TEST_VERIFIED`, and `URAI_SMOKE_TEST_EVIDENCE_URL` set | RED |

## Repo-Side Controls Already Implemented

- CI verification workflow
- release promotion workflow
- production evidence validator
- production smoke validator
- production readiness validator
- Firebase runtime verification documentation
- Firestore and Storage rules architecture
- emulator scaffold and runtime validation scripts
- analytics consent tests
- monitoring and alerting tests
- live persistence disabled-by-default tests
- admin authorization tests
- deployment and rollback runbooks

## Rule

Do not mark URAI Storytime production-ready until every RED blocker above is supported by real evidence and the release promotion workflow passes.
