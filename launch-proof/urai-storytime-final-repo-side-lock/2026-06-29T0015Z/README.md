# URAI Storytime final repo-side production lock

Timestamp: 2026-06-29T0015Z

## Repo-side state

The repository now includes production-oriented Storytime implementation and release controls:

- Cloud and demo routing with honest gates.
- Firebase Auth UI for email/password accounts.
- Firestore-backed cloud session loading.
- Full cloud session hydration for chapters, scenes, narrator scripts, and emotional arc.
- Public share creation controls with explicit consent.
- Public share revocation callable and UI flow.
- Provider readiness checks.
- Safety moderation before generation.
- Firestore-backed generation quota counters.
- Privacy-safe structured audit logging.
- Smoke tests for routes, auth wiring, share lifecycle, quota gates, and audit logging.
- Deployment runbooks and release evidence templates.

## What repository access completed

Repository commits added code, tests, docs, proof folders, and validation gates. The code path now fails closed when required Firebase, provider, sharing, or production proof settings are absent.

## What still requires live external execution

The following cannot be truthfully completed by repository edits alone:

- Create or select Firebase staging and production projects.
- Enable Hosting, Functions, Firestore, Storage, and Auth.
- Configure deploy credentials outside source control.
- Configure provider secrets outside source control.
- Run CI with successful install, typecheck, tests, app build, and Functions build.
- Deploy rules, indexes, Functions, and Hosting.
- Smoke test the live URL.
- Capture screenshots and deploy logs.
- Record legal, privacy, child safety, and provider output approvals.

## Final promotion rule

Do not mark Storytime PRODUCTION READY or LIVE until the external execution items above are completed and proof is stored under launch-proof.

## Current honest verdict

DEPLOYMENT-READY CODE, BLOCKED BY LIVE INFRASTRUCTURE EXECUTION AND EVIDENCE.
