# URAI Storytime Firebase Readiness

## Current status

The current application is still primarily a local/static demo experience.

Firebase production readiness is NOT yet verified.

## Required before any production deploy

- Verify Firebase project ID
- Verify staging project
- Verify production project
- Verify hosting targets
- Verify auth configuration
- Verify Firestore rules
- Verify Storage rules
- Verify rollback process
- Verify CI pipeline passes
- Verify smoke tests pass
- Verify legal/privacy review
- Verify child-safety review

## Deployment safety rules

Do not deploy from unknown branches.

Do not deploy to production without:

- successful build
- successful tests
- verified Firebase target
- verified environment configuration
- rollback readiness

## Recommended environments

- local
- staging
- production

## Recommended collections

- users
- families
- childProfiles
- stories
- storyRuns
- moderation
- auditLogs

## Current blockers

- No verified Firebase project
- No verified auth flow
- No verified Firestore schema
- No verified billing
- No verified moderation pipeline
- No verified production deployment target
