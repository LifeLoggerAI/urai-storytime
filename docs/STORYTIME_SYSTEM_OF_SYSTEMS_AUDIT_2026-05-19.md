# URAI Storytime System-of-Systems Audit Record

Date: 2026-05-19
Branch: `implementation/storytime-system-audit-2026-05-19`
Project: `LifeLoggerAI/urai-storytime`

## Executive verdict

URAI Storytime is no longer just the older static local demo described in parts of the historical launch audit. The current repository is a Next.js + Firebase-oriented Storytime system with Firebase callable hooks, Firestore rules/index scaffolding, CI, runtime readiness modeling, deployment docs, QA checklist, and production-blocker documentation.

Current release posture remains: **not production/live-published verified**.

The repo has meaningful wiring, but production completion is blocked until environment-specific Firebase credentials, domain/DNS/SSL, provider secrets, staging deploy evidence, production deploy evidence, and live smoke results are recorded.

## Source-of-truth reality check

### Verified current repo facts

- Repository: `LifeLoggerAI/urai-storytime`.
- Default branch: `main`.
- Package version: `2.5.0`.
- Runtime stack: Next.js 15, React 19, Firebase client/admin/functions, Zod, TypeScript.
- CI exists at `.github/workflows/ci.yml` and runs app install, lint/typecheck, tests, smoke tests, deployment/security/emulator/production-readiness validation, production build, and Functions build.
- Production-only evidence gates run on `main` and check provider wiring, production evidence, and production smoke scripts.

### Important documentation conflict

`README.md` still describes the project as a standalone static demo using vanilla HTML/CSS/JavaScript and a built-in Node preview server. That language conflicts with the current `package.json`, smoke tests, Next routes, Firebase Functions, and deployment docs.

Resolution: treat `README.md` static-demo language as stale historical launch-boundary copy until updated. Treat `package.json`, `docs/STORYTIME_DEPLOYMENT.md`, `docs/STORYTIME_QA_CHECKLIST.md`, `src/components/storytime/StorytimeHome.tsx`, Firebase files, Functions, and validation scripts as the current implementation baseline.

## Current system map

### Frontend surfaces

- `/storytime`: Storytime home and private story seed UI.
- `/storytime/settings`: settings surface referenced in deployment and QA docs.
- `/storytime/[sessionId]`: session playback route expected to render StoryPlayer, ChapterTimeline, EmotionalArcViewer, and related Storytime components.
- `/share/story/[shareId]`: public-safe/redacted sharing route.
- Legacy demo route: linked from Storytime nav as `/`.

### Backend/services

- Firebase callable functions in `functions/src/storytime.ts`:
  - `generateStorySession`
  - `createPublicStoryShare`
  - `generateNarratorScript`
  - `generateEmotionalArcSummary`
  - `generateWeeklyStoryScroll`
  - `prepareVoiceoverJob`
  - `refreshStoryTimeline`
  - `rebuildUserStoryArchive`

### Data model / collections implied by code and tests

- `storySessions`
- `storyChapters`
- `storyMoments`
- `memoryScenes`
- `narratorScripts`
- `emotionalArcSummaries`
- `publicStoryShares`
- analytics / event evidence collections as covered by validation tests

### Privacy and safety controls currently wired

- Callable functions require auth before private story lifecycle operations.
- Story generation requires explicit `consentSnapshot.storyGeneration`.
- Public sharing requires explicit consent.
- Public share text uses redaction helper for names, addresses, phone numbers, and email addresses.
- Runtime readiness defaults production status to RED until external systems are verified.
- Storytime copy and QA docs preserve the boundary against diagnosis, therapy, passive sensing, compliance, and public sharing overclaims.

### Asset-Factory integration status

The intended integration is: Storytime CMS/backend creates structured story scenes, converts them into the Asset-Factory schema, submits a `POST /v1/jobs` request, polls `/v1/jobs/{job_id}`, downloads the asset bundle, and ingests generated assets back into Storytime. The deployment doc says an Asset-Factory adapter hook exists for future media generation jobs, but production credentials and end-to-end job verification remain blocked.

## System-of-systems roadmap

### Phase 0: Demo and boundaries

Status: substantially complete, but documentation needs cleanup.

Acceptance criteria:
- Public copy clearly says what is live and what is future.
- Legacy static/local demo remains available without implying cloud production readiness.
- README, deployment docs, QA docs, and production readiness docs agree on current architecture.

### Phase 1: Next/Firebase cloud architecture

Status: scaffolded and partially implemented.

Acceptance criteria:
- Next routes build successfully.
- Firebase config, rules, indexes, hosting, and functions compile.
- CI passes on pull request and main.
- Cloud mode remains disabled unless environment variables and auth are configured.

### Phase 2: Auth and private family data

Status: blocked by environment and final auth setup.

Acceptance criteria:
- Adult/parent auth provider configured.
- All callable functions enforce auth.
- Firestore rules enforce owner-only private reads/writes.
- Cross-user access tests fail safely.
- Account export/delete flows are implemented and tested.

### Phase 3: Story generation and moderation

Status: deterministic/scaffolded generation and local checks exist; production AI/provider moderation not verified.

Acceptance criteria:
- Story generation provider interface is configured per environment.
- Input and output moderation both run.
- Sensitive sessions route to review instead of public/shareable output.
- Every generated story records `whyGenerated`, consent snapshot, source signals, and safety status.

### Phase 4: Public-safe sharing

Status: scaffolded.

Acceptance criteria:
- Public shares require explicit consent.
- Public shares are redacted.
- Revoked shares become unreadable.
- Share route makes clear the content is public-safe and privacy-reduced.

### Phase 5: Asset-Factory media expansion

Status: future/integration hook only until credentials and job lifecycle are verified.

Acceptance criteria:
- Storytime payload conforms to Asset-Factory input schema.
- Authenticated API key is configured outside source control.
- Jobs submit to `/v1/jobs`.
- Job status polls `/v1/jobs/{job_id}`.
- Completed bundles are downloaded/ingested.
- Failed jobs surface safe retry/error states.

### Phase 6: URAI ecosystem integrations

Status: planned/scaffolded, not production verified.

Required systems:
- URAI shared auth / identity
- URAI Admin moderation and audit queue
- URAI Analytics consent-safe telemetry
- URAI Privacy export/delete/retention hooks
- URAI Content shared story library
- URAI Communications parent notifications
- URAI Billing/entitlements, if paid features launch

Acceptance criteria:
- Integrations are behind adapters and feature flags.
- Each integration has tests or recorded staging evidence.
- Public copy does not claim any integration is live before evidence exists.

## Highest-priority gaps

### P0 blockers

1. Production deploy target, DNS, SSL, and live smoke evidence are not recorded.
2. Firebase project IDs/secrets and production credentials are not verified.
3. README conflicts with current Next/Firebase implementation.
4. Auth/account lifecycle is not proven live.
5. Provider secrets for AI generation, Asset-Factory, and any production TTS/media flow are not verified.
6. Legal/privacy/child-safety review is not recorded as approved for production launch.

### P1 blockers

1. Asset-Factory adapter needs end-to-end staging job evidence.
2. CI run evidence for the current head should be linked in release notes.
3. Browser/manual QA checklist needs checked results, not just checklist items.
4. Production evidence and smoke docs should name exact deployed URLs and timestamps.
5. Documentation should retire or clearly label stale static-demo architecture sections.

## Implementation performed in this pass

- Created this audit record as the current system-of-systems alignment artifact.
- Classified the repo as a Next.js + Firebase Storytime cloud scaffold with production readiness blocked by evidence and credentials.
- Identified the stale README/static-demo language as a coherence defect.
- Preserved the production safety boundary: no claim of live deployment, publishing, paid billing, or verified cloud operation is made here.

## Verification performed in this pass

Connector/API inspection only. No local checkout command execution and no live deployment were performed in this pass.

Inspected:
- `README.md`
- `package.json`
- `.github/workflows/ci.yml`
- `docs/DONE_DONE_LAUNCH_AUDIT.md`
- `docs/STORYTIME_DEPLOYMENT.md`
- `docs/STORYTIME_QA_CHECKLIST.md`
- `src/components/storytime/StorytimeHome.tsx`
- `src/runtime-readiness.mjs`
- `functions/src/storytime.ts`
- `tests/e2e/smoke.test.mjs`
- `scripts/validate-production-readiness.mjs`

## Commands/checks still required in a checkout or CI

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run test:security-rules
npm run test:emulator-scaffold
npm run test:emulator-runtime
npm run test:production-readiness
npm run build

cd functions
npm install
npm run build
```

Then, only after environment credentials are present:

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
npm run validate:release-promotion
```

## Deployment status

Not deployed or published by this pass.

Deployment remains blocked until:
- Firebase project and target are selected.
- Secrets are configured outside source control.
- Staging deploy passes.
- Production deploy approval is explicit.
- Live smoke evidence is recorded.

## Next implementation pass

1. Update `README.md` to match the current Next/Firebase architecture.
2. Add a release evidence update once CI has run on this branch.
3. Run or trigger CI and inspect failures.
4. Fix any CI/build/type/test failures.
5. Update stale sections in `docs/DONE_DONE_LAUNCH_AUDIT.md` or replace it with a current launch audit.
6. Implement Asset-Factory adapter tests around the documented `/v1/jobs` lifecycle.
7. Add staging Firebase environment evidence once credentials are available.
