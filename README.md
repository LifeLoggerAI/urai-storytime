# URAI Storytime

URAI Storytime is the URAI narrative engine for turning opted-in life signals, private reflections, and story seeds into structured story sessions, chapters, memory moments, narrator scripts, emotional arcs, and public-safe story shares.

## Current launch status

**Status: Done but needs external environment, CI, emulator, provider, deploy, and safety/legal receipts. Not production/live-published verified.**

This repository has moved beyond the older standalone static demo. The current implementation uses Next.js, React, Firebase client/admin/functions, Firestore rules/index scaffolding, CI validation, runtime readiness gates, Storytime deployment/QA documentation, production-boundary regression tests, and explicit launch-proof records.

Production launch is still blocked until isolated Storytime Firebase credentials, auth configuration, provider secrets, staging/production deploys, DNS/SSL, live smoke tests, child-safety/legal review, and release evidence are verified and recorded.

## Stack

- Next.js 15
- React 19
- TypeScript
- Firebase client SDK
- Firebase Admin SDK
- Firebase Functions v2
- Firestore rules and indexes
- Zod validation
- Node test runner
- GitHub Actions CI

## Current surfaces

- `/storytime` – Storytime home and private story seed UI
- `/storytime/settings` – Storytime settings surface
- `/storytime/[sessionId]` – story session playback route
- `/share/story/[shareId]` – public-safe/redacted share route
- `/` – legacy demo entry where still retained

## Current backend hooks

Firebase callable functions include:

- `generateStorySession`
- `createPublicStoryShare`
- `generateNarratorScript`
- `generateEmotionalArcSummary`
- `generateWeeklyStoryScroll`
- `prepareVoiceoverJob`
- `refreshStoryTimeline`
- `rebuildUserStoryArchive`
- `revokePublicStoryShare`

These functions enforce auth boundaries, consent checks, private-by-default story sessions, public sharing consent, redaction scaffolds, queued-only export/voiceover status, default public-share expiration, and owner revoke support. They still require Firebase environment configuration and staging/production verification before public launch claims.

## Current production boundary

Implemented or source-wired in code:

- Next.js Storytime routes
- Firebase callable lifecycle hooks
- Firestore rules/index scaffolding
- Storytime domain models and safety helpers
- Runtime readiness gates that default production status to blocked
- CI validation workflow
- Production-boundary regression tests
- Emulator behavior proof spec and validator
- Isolated Storytime Firebase production config gate
- Public-share default expiration using `STORYTIME_PUBLIC_SHARE_TTL_DAYS`
- Deployment and QA checklists
- Asset-Factory adapter path documented for future media jobs

Not verified as live production:

- Isolated Storytime Firebase staging/production project and credentials
- GitHub Actions passing run on the latest production-lock commit
- Live auth/account lifecycle
- Live Firestore/Storage writes under production rules
- Behavioral Firebase emulator proof for owner, non-owner, public-share, revoke, and storage scenarios
- Production AI provider generation
- Production TTS/media generation
- Asset-Factory production credentials and end-to-end job ingestion
- Paid billing or entitlement enforcement
- Final legal/privacy/child-consent approval
- Verified deployment at `https://www.uraistorytime.com`
- DNS, SSL, redirect, and rollback evidence

## Environment variables

Copy `.env.example` and configure staging/production values outside source control. Important variables include:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_STORYTIME_CLOUD_MODE=false
NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING=false
NEXT_PUBLIC_STORYTIME_PROVIDER_READY=false

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

URAI_STORYTIME_FIREBASE_PROJECT_ID=
URAI_STORYTIME_STAGING_TARGET=
URAI_STORYTIME_PRODUCTION_TARGET=
URAI_CORE_FIREBASE_PROJECT_ID=
URAI_ANALYTICS_FIREBASE_PROJECT_ID=
STORYTIME_FIREBASE_ISOLATED=false

STORYTIME_CLOUD_MODE=false
STORYTIME_PUBLIC_SHARING=false
STORYTIME_GENERATION_PROVIDER=disabled
STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER=false
STORYTIME_PUBLIC_SHARE_TTL_DAYS=30
ASSET_FACTORY_BASE_URL=
ASSET_FACTORY_API_KEY=
OPENAI_API_KEY=
STORYTIME_OPENAI_MODEL=
```

For production, `STORYTIME_FIREBASE_ISOLATED` must be `true`, and the Storytime Firebase project must not equal the Core or Analytics Firebase project IDs.

## Scripts

- `npm run dev` – run Next.js development server
- `npm run build` – build the Next.js app
- `npm run start` – start the built Next.js app
- `npm run lint` – currently aliases typecheck
- `npm run typecheck` – run TypeScript without emitting files
- `npm run test` – run unit and e2e Node tests
- `npm run test:smoke` – run Storytime smoke test
- `npm run test:e2e` – currently aliases smoke test
- `npm run test:env-template` – validate env template and safe defaults
- `npm run test:security-rules` – validate Firestore/security-rule scaffolding
- `npm run test:emulator-scaffold` – validate emulator scaffolding
- `npm run test:emulator-runtime` – validate emulator runtime wiring
- `npm run test:emulator-behavior-spec` – validate required emulator behavior proof spec
- `npm run test:provider-wiring` – validate provider wiring evidence
- `npm run test:production-config` – validate strict live-production config gates
- `npm run test:production-evidence` – validate production evidence records
- `npm run test:production-smoke` – validate production smoke records
- `npm run test:production-readiness` – validate production readiness artifacts
- `npm run emulators:test` – run emulator scaffold/runtime/spec checks in Firebase emulators
- `npm run deploy` – build and run Firebase deploy

## Local verification

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
npm run test:emulator-behavior-spec
npm run test:provider-wiring
npm run test:production-readiness
npm run build

cd functions
npm install
npm run build
```

## Deployment

See `docs/STORYTIME_DEPLOYMENT.md` for deploy order, required environment variables, Firebase setup, post-deploy smoke checks, rollback, and known launch boundaries.

Core deploy order after CI and production config gates pass:

```bash
npm run validate:release-promotion
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```

Do not claim production launch until staging and production deploy evidence, live route checks, callable function checks, DNS/SSL checks, emulator behavior proof, provider smoke proof, and rollback notes are recorded.

## System-of-systems audit

See `docs/STORYTIME_SYSTEM_OF_SYSTEMS_AUDIT_2026-05-19.md` for historical audit context, roadmap, integration map, production blockers, verification record, and next implementation pass.

Historical launch-audit material remains in `docs/DONE_DONE_LAUNCH_AUDIT.md`, but some sections describe the older static demo and should be treated as stale until reconciled.

Current launch-proof records are in `launch-proof/urai-storytime-production-lock/2026-06-30T0100Z/`.

## Security & privacy

- Story sessions must remain private by default.
- Storytime production Firebase must be isolated from Core and Analytics projects.
- Public sharing must require explicit consent.
- Public shares must be redacted, revocable, and time-limited by default.
- Story generation must record why a story was generated and what consent snapshot applied.
- Sensitive prompts/outputs must go through moderation and review before production use.
- Do not collect real child-sensitive information in unverified environments.
- Production launch requires verified auth, database rules, deletion/export, consent, safety review, legal approval, and release evidence.
