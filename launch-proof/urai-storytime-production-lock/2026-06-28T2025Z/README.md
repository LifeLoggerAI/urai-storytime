# URAI Storytime Production Reality Lock

Timestamp: 2026-06-28T20:25Z  
Repository: LifeLoggerAI/urai-storytime  
Audit branch/ref inspected: main  
Audit verdict: PROTOTYPE ONLY

## Executive verdict

URAI Storytime is not a production-ready live story system and no deployed live user flow was verified in this audit. The repo contains a Next.js Storytime demo surface, deterministic story-session rendering code, Firebase callable-function scaffolding, Firestore/Storage rules, and release-gate documentation. That is meaningful implementation work, but it is still a prototype/scaffold until the app is deployed, user-visible at a verified URL, wired to auth/persistence/providers, and smoke-tested end to end.

The app is blocked from DONE DONE because real cloud generation is not client-wired, real auth is not user-wired, real persistence is not user-wired, production deployment evidence is missing, child/family safety is not production-complete, and live deployed URL/API behavior was not verified in this audit environment.

## Scope inspected

- `README.md`
- `package.json`
- `.env.example`
- `.firebaserc`
- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `next.config.mjs`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/storytime/page.tsx`
- `src/app/storytime/[sessionId]/page.tsx`
- `src/app/storytime/settings/page.tsx`
- `src/app/share/story/[shareId]/page.tsx`
- `src/components/storytime/*`
- `src/lib/storytime/*`
- `src/lib/firebase/client.ts`
- `src/lib/firebase/admin.ts`
- `src/runtime-readiness.mjs`
- `src/firebase-adapter.mjs`
- `src/auth-boundary.mjs`
- `src/live-persistence.mjs`
- `src/moderation-boundary.mjs`
- `src/moderation-queue.mjs`
- `src/privacy-operations.mjs`
- `src/privacy-jobs.mjs`
- `functions/src/*`
- `tests/e2e/smoke.test.mjs`
- `tests/unit/*`
- `.github/workflows/*`
- `docs/RELEASE_EVIDENCE_LOG.md`
- `docs/PRODUCTION_READINESS_STATUS.md`
- `docs/STORYTIME_DEPLOYMENT.md`
- stale legacy static files under `src/index.html`, `src/app.js`, and related `.mjs` boundary/demo files

## Route map

| Route/location | Actual behavior from code | Status | Risk |
|---|---|---|---|
| `/` | Redirects to `/storytime` through Next `redirect('/storytime')`. Runtime not verified in this audit. | UNKNOWN / NEEDS ACCESS | MEDIUM |
| `/storytime` | Renders Storytime home and a client-side form in code. Submit builds query params and assigns `window.location` to `/storytime/demo`; it does not call cloud generation. | UI ONLY | HIGH |
| `/storytime/demo` | Only statically generated dynamic session route. Builds a deterministic story from query title/source using `buildStorySession`. | PLACEHOLDER / MOCK | HIGH |
| `/storytime/[sessionId]` | Dynamic route exists, but `dynamicParams = false` and `generateStaticParams()` only returns `{ sessionId: 'demo' }`; arbitrary real session IDs are not production-routable from this static config. | BROKEN | LAUNCH BLOCKER |
| `/storytime/settings` | Read-only settings/status page. No persisted preferences or live account controls. | UI ONLY | HIGH |
| `/share/story/demo` | Static demo public-share page explaining intended safety boundaries. | UI ONLY | HIGH |
| `/share/story/[shareId]` | Dynamic route is also `dynamicParams = false` and only prebuilds demo share ID. Real share IDs are not production-routable from this static config. | BROKEN | LAUNCH BLOCKER |
| API routes under Next `src/app/api` | No route handlers found by code search/inspection. | MISSING | HIGH |
| Firebase callable functions | Function source exists for generation/share/narrator/arc/weekly-scroll/voiceover/timeline/archive hooks. Not verified deployed/callable live in this audit and not called by the Storytime UI. | IMPLEMENTED BUT NOT WIRED | LAUNCH BLOCKER |
| Legacy static `src/index.html` + `src/app.js` | Stale static app files exist. `src/app.js` references route functions that are not present in the fetched file, so this legacy app should not be treated as a working deploy artifact. | BROKEN | MEDIUM |

## Feature truth table

| Feature | User-facing route/location | Claimed/implied behavior | Actual implementation status | Code evidence inspected | Runtime/deploy evidence | Status label | Needed for DONE DONE | Risk |
|---|---|---|---|---|---|---|---|---|
| Home/landing | `/storytime` | Storytime narrative engine home | Next route imports `StorytimeHome`; page code renders hero/cards/form. | `src/app/storytime/page.tsx`, `src/components/storytime/StorytimeHome.tsx` | No live browser screenshot captured; no deployment proof verified. | UI ONLY | Live URL smoke, screenshots, console/network check. | MEDIUM |
| Story creation form | `/storytime` | Create/generate story session | Form does not call Firebase/LLM. It redirects to `/storytime/demo` with query params. Button copy was fixed from overclaiming generation to `Open Demo Story Session`. | `StorytimeHome.tsx` | No browser runtime proof captured. | UI ONLY | Client auth + callable invocation + persistence + error/loading states. | HIGH |
| Demo story rendering | `/storytime/demo` | Story replay page | Deterministic local builder renders one chapter, one scene, narrator text, arc, relationship card, ritual card, scroll preview. | `src/app/storytime/[sessionId]/page.tsx`, `src/lib/storytime/story-builder.ts`, components | No live deployment proof verified. | PLACEHOLDER / MOCK | Render saved sessions by ID, fetch persisted data, handle missing/unauthorized states. | HIGH |
| LLM generation | Callable/function scaffold | Real story generation | No provider call found. Function builds deterministic records from input text and writes Firestore only if deployed/authenticated. | `functions/src/storytime.ts` | Not deployed/callable verified. | MISSING | Provider integration, moderation, retries, cost/rate limits, tests, live proof. | LAUNCH BLOCKER |
| Image generation | Memory scene prompt | Illustrations/images | Only text scene prompts exist; no image provider integration verified. | `MemorySceneCard.tsx`, `story-builder.ts` | None. | MISSING | Real image provider/job flow, storage, safety review. | HIGH |
| Audio/TTS/voiceover | `prepareVoiceoverJob` | Narration/voiceover | Function queues records only. No TTS call, no audio file, no playback UI. | `functions/src/storytime.ts`, `types.ts` | Not deployed/callable verified. | IMPLEMENTED BUT NOT WIRED | TTS provider, media storage, consent, playback, captions, errors. | LAUNCH BLOCKER |
| Save/load/history | backend collections/types | Story saves/history | Firestore collections/rules and function writes exist; user UI does not call them. No cross-device persistence verified. | `firestore.rules`, `functions/src/storytime.ts`, `src/lib/firebase/client.ts` | None. | IMPLEMENTED BUT NOT WIRED | Authenticated UI, Firestore reads/writes, emulator/live tests. | LAUNCH BLOCKER |
| Public sharing | `/share/story/demo`; callable `createPublicStoryShare` | Redacted public story shares | Demo page only for UI; callable writes public share records with simple redaction if deployed. Real share routes only prebuild demo. | `src/app/share/story/[shareId]/page.tsx`, `functions/src/storytime.ts`, `redaction.ts`, `firestore.rules` | None. | UI ONLY | Real share fetch by slug/ID, revoke, live rules tests, URL proof. | LAUNCH BLOCKER |
| Parent/settings controls | `/storytime/settings` | Privacy/narrator controls | Read-only status page explicitly says settings are not live account controls. | `StorySettings.tsx` | None. | UI ONLY | Persisted preferences, auth, ownership model, consent logs. | HIGH |
| Child/family safety | copy/rules/boundaries | Family-safe/kid-safe behavior | Deterministic blocklists and safety copy exist; no production moderation, output checks, review queue, child policy/legal approval verified. | `safety.ts`, `moderation-boundary.mjs`, `moderation-queue.mjs`, docs | None. | IMPLEMENTED BUT NOT WIRED | Policy review, provider moderation, output moderation, review/escalation, logs. | LAUNCH BLOCKER |
| Auth | Firebase client/admin files, functions require auth | User identity/account lifecycle | Firebase client/admin setup files exist; no sign-in UI or user account flow inspected in Next app. Callable functions require auth. | `src/lib/firebase/client.ts`, `src/lib/firebase/admin.ts`, `functions/src/storytime.ts` | Not verified. | IMPLEMENTED BUT NOT WIRED | Adult account model, login/logout UI, Firebase Auth config, tests. | LAUNCH BLOCKER |
| Privacy operations | privacy modules/docs | Export/delete/privacy flows | Data shapes and scaffolds exist; no user-visible flow and not wired to backend jobs. | `privacy-operations.mjs`, `privacy-jobs.mjs`, docs | None. | IMPLEMENTED BUT NOT WIRED | Live export/delete request UI, backend jobs, audit trail. | HIGH |
| Security rules | Firestore/Storage rules | Owner/public-share boundaries | Rules exist and are deny-by-default at catchall; public shares readable when not revoked. Static validation exists; live/emulator proof not verified here. | `firestore.rules`, `storage.rules`, scripts/tests | Prior docs say static checks passed, runtime proof still required. | IMPLEMENTED BUT NOT WIRED | Emulator/live rule tests and release evidence. | LAUNCH BLOCKER |
| Deployment | Firebase config/docs | Hosted app | `firebase.json` exists, but `.firebaserc` keeps placeholder project and README/docs say production not verified. | `firebase.json`, `.firebaserc`, README/docs | URLs not verified in this audit. | UNKNOWN / NEEDS ACCESS | Real project, DNS/SSL, deploy logs, smoke proof. | LAUNCH BLOCKER |
| Tests/build | scripts/workflows | CI verifies app | Scripts and workflows exist. Current post-fix commit had no workflow runs fetched. Local clone/build/test could not run in this environment due DNS failure. | `package.json`, `.github/workflows/ci.yml`, release evidence log | Current commit CI unknown. | UNKNOWN / NEEDS ACCESS | Run install/typecheck/test/build/functions build and attach logs. | LAUNCH BLOCKER |

## Commands and verification results

Local terminal attempts in this audit environment:

```bash
git clone https://github.com/LifeLoggerAI/urai-storytime.git /mnt/data/urai-storytime
# Result: FAILED in the container: Could not resolve host: github.com
```

```bash
for url in \
  https://www.uraistorytime.com \
  https://uraistorytime.com \
  https://urai-storytime.web.app \
  https://urai-storytime.firebaseapp.com \
  https://urai-storytime-staging.web.app \
  https://urai-storytime-staging.firebaseapp.com; do
  curl -I -L --max-time 15 "$url"
done
# Result: FAILED in the container: DNS resolution failed for tested hosts.
```

Because the repo could not be cloned in the container, these local commands were not run in this audit:

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
cd functions && npm install && npm run build
```

GitHub connector checks:

- Repository `LifeLoggerAI/urai-storytime` exists, public, default branch `main`, admin/push access available through connector.
- Current audit fix/proof commits were made through the connector.
- Fetched workflow runs for current proof commit returned an empty list, so current CI status is UNKNOWN.
- Fetched combined commit status for current proof commit returned no statuses, so current branch protection/status result is UNKNOWN.

Existing repo evidence:

- `package.json` defines scripts for build/typecheck/test/smoke/deployment/readiness.
- `.github/workflows/ci.yml` defines install, lint, typecheck, tests, smoke, production readiness, and build jobs.
- `docs/RELEASE_EVIDENCE_LOG.md` records prior PR-side green checks for an older release candidate, but the same file records final release status RED and production deploy/live evidence missing.

## Screenshots

No screenshots were captured in this audit. The app could not be run locally because cloning failed in the terminal environment, and no verified live URL rendered through the available tools.

## API/function check results

- No Next API route handlers were found.
- Firebase callable function source exists for:
  - `generateStorySession`
  - `createPublicStoryShare`
  - `generateNarratorScript`
  - `generateEmotionalArcSummary`
  - `generateWeeklyStoryScroll`
  - `prepareVoiceoverJob`
  - `refreshStoryTimeline`
  - `rebuildUserStoryArchive`
- Function source requires auth for callable operations.
- Function source was not verified deployed or callable in staging/production.
- No live API/function URL response was verified.

## Safe fixes made

1. Changed the `/storytime` primary button copy from `Generate Story Session` to `Open Demo Story Session`.
2. Clarified the explanatory copy to state that callable functions exist only as backend scaffold and the form does not call them until Firebase env vars, auth, and client wiring are configured.
3. Removed the misleading `Legacy demo` link from the Next Storytime nav because `/` now redirects to `/storytime` and the old static demo files are stale/broken artifacts, not a verified production surface.

## Known blockers

1. No verified production deployment URL.
2. `.firebaserc` still contains placeholder project ID/target.
3. No verified Firebase credentials/secrets in this audit.
4. No client wiring from `/storytime` form to Firebase callable functions.
5. No real LLM provider call found.
6. No real image provider integration found.
7. No real TTS/audio generation or playback found.
8. No user-visible auth/account flow found in the Next app.
9. No persisted settings UI or user preference save/load path.
10. Dynamic Storytime route is static-demo-only (`demo`) and does not support arbitrary persisted session IDs as a production route.
11. Dynamic public share route is static-demo-only (`demo`) and does not support arbitrary real share IDs as a production route.
12. Child/family safety is only partial blocklist/scaffold/copy; no production moderation + review + legal/policy proof.
13. Privacy export/delete flows are scaffolds, not user-visible production operations.
14. Current commit CI/build/test status is unknown from fetched workflow/status data.
15. Live browser/manual/mobile/accessibility/performance proof is absent.

## Final launch verdict

Verdict: PROTOTYPE ONLY

This repo is more than a blank hosting shell because it contains Next route/component code, a deterministic demo session builder, Firestore/Storage rules, and callable-function source for cloud lifecycle hooks. It is still only a prototype because none of the production-critical pieces were verified live: deployment, auth, cloud generation, persistence, public sharing, child/family safety, provider integration, production tests, and smoke evidence.

## DONE DONE gap estimate

- 0-2 hours: copy/doc cleanup, remove stale legacy links, add current proof files, run CI if environment access is available.
- Half day: wire local browser smoke tests and add route-level E2E screenshots for demo-only flows.
- 1 day: connect authenticated client callable path for story creation with loading/error states against emulator/staging.
- 2-3 days: add persisted session fetch/render, public share fetch/revoke, settings persistence, emulator-backed rules tests, and deployment smoke proof.
- More than 3 days: real LLM/TTS/image provider integrations, child/family safety review, moderation pipeline, cost/rate limiting, privacy operations, legal approvals, production deployment/DNS/SSL/rollback evidence.
