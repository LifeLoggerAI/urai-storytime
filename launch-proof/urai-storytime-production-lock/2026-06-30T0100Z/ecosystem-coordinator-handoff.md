# URAI Storytime ecosystem coordinator handoff

## Repo

`LifeLoggerAI/urai-storytime`

## Current status

DONE BUT NEEDS EXTERNAL ENV / CI / DEPLOY RECEIPTS

Do not mark this repo production-ready in the global URAI release plan yet.

## Production-ready claim allowed?

No.

## What is implemented or source-wired

- Next.js Storytime routes.
- Firebase callable lifecycle hooks.
- Auth-required generation/share/export callables.
- Consent-gated generation, public sharing, and voiceover queueing.
- OpenAI provider wiring gates.
- Private-by-default Firestore model and rule scaffold.
- Public-safe share creation, owner revoke, and default public-share expiration.
- Runtime readiness model that stays RED until external proof exists.
- Production-boundary regression tests.
- Emulator behavior proof spec and validator.
- Isolated Storytime Firebase production config gate.
- CI-oriented verification workflow and production verification script.

## What is not verified

- GitHub Actions passing run for latest commit.
- Isolated Storytime Firebase staging/production project IDs and targets.
- Firebase deploy.
- Firebase emulator behavior execution.
- Live authenticated generation.
- Live Firestore persistence readback.
- Live public share create/fetch/revoke smoke.
- Live voiceover/export artifact processing.
- OpenAI provider-backed generation smoke.
- Asset Factory production ingestion.
- DNS/SSL/rollback proof.
- Child-safety, privacy, and legal approval receipts.

## Required receipts to upgrade to production-ready

1. Passing GitHub Actions run for the latest `main` commit.
2. `STORYTIME_FIREBASE_ISOLATED=true` with Storytime Firebase project ID distinct from Core and Analytics.
3. Passing Firebase emulator behavior proof for owner, other-user, admin, signed-out, public-share, revoke, quota, and storage scenarios.
4. Staging Firebase deploy receipt.
5. Production Firebase deploy receipt.
6. Provider-backed generation smoke receipt.
7. Persistence readback receipt.
8. Public-share create/fetch/revoke receipt.
9. Export/voiceover artifact receipt or explicit disabled launch gate.
10. Child-safety, privacy, and legal approval receipts.

## Coordinator verdict

`urai-storytime` is repo-side hardened and source-wired, but should be marked `DONE BUT NEEDS EXTERNAL ENV` only. It must not be listed as production-ready until the external receipts above are attached.

## Copy-paste global release note

`urai-storytime: DONE BUT NEEDS EXTERNAL ENV. Source gates, public-share expiry, isolated Firebase enforcement, production-boundary tests, and emulator behavior proof spec are implemented. Block production-ready until GitHub Actions pass, isolated Firebase targets, emulator behavior execution, provider smoke, live persistence/share/revoke/export receipts, and safety/legal/privacy approvals are attached.`
