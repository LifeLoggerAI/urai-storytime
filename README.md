# URAI Storytime

URAI Storytime is a privacy-first, family-safe storytelling web app that turns parent-approved story inputs into gentle bedtime stories, local demo replays, and launch-gated production storytelling surfaces.

## Current launch status

**Status: Production implementation candidate / launch-gated preview.**

This branch contains a Next.js app with local demo story generation, safety checks, story replay, library routes, Firebase configuration/rules scaffolding, admin/moderation shells, and Playwright/Vitest validation. The app is not considered production-launched until deployment, Firebase rules, auth, persistence, moderation, billing, legal/privacy review, and live smoke checks are verified.

## Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Vitest unit tests
- Playwright end-to-end tests
- Firebase / Firestore / Storage / Functions configuration scaffolding
- Local browser storage for demo story persistence
- Optional OpenAI story provider wiring behind environment configuration

## Features in this build

- Public launch shell with Home, Features, Pricing, Demo, Create, Library, Safety, Contact, Privacy, Terms, Login, Signup, Dashboard, Admin, Creator, Parent, School, and Settings routes
- Local story generation engine with scene splitting and family-safe prompt handling
- Conservative safety precheck for unsafe story prompts
- Story library/history in browser local storage
- Story replay route with narration controls
- Admin/moderation shell routes that remain launch-gated
- Firebase rules, indexes, functions scaffolding, and storage rules for future cloud persistence
- Environment examples for launch-gated provider and Firebase configuration
- Unit tests for safety and story engine behavior
- Playwright e2e tests for create/replay and safety blocking flows
- Mobile-responsive Next app shell
- Explicit launch-boundary language for unlaunched auth, billing, admin, and cloud features

## Not launched yet

- Real production user accounts/auth
- Verified Firestore cloud persistence for live families
- Production child safety/moderation workflow
- Paid subscriptions or entitlement enforcement
- Full admin operations and audit review workflow
- Shared URAI Labs auth, analytics, communications, privacy, content, and billing integrations
- Final legal privacy/terms/child-consent policy approval
- Verified production deployment at `https://www.uraistorytime.com`

## Environment variables

See `.env.example`. Local demo flows do not require secrets. Provider-backed generation, Firebase deployment, analytics, and production integrations must remain disabled until their environment variables, rules, and operational controls are verified.

## Scripts

- `npm run dev` - start the Next.js dev server
- `npm run build` - create an optimized Next.js production build
- `npm run start` - run the built Next.js app
- `npm run lint` - run the configured lint command
- `npm run typecheck` - run TypeScript without emitting files
- `npm run test` - run Vitest unit tests
- `npm run test:watch` - run Vitest in watch mode
- `npm run test:e2e` - run Playwright e2e tests
- `npm run test:e2e:install` - install Playwright Chromium
- `npm run test:e2e:install-with-deps` - install Playwright Chromium with system dependencies
- `npm run test:smoke` - run the Storytime Playwright smoke spec
- `npm run format` - check formatting
- `npm run format:write` - write formatting changes
- `npm run firebase:emulators` - start Firebase emulators
- `npm run deploy` - build and deploy through Firebase CLI; use only after staging/production readiness approval

## Local verification

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Latest observed local evidence from the implementation branch:

- `npm test` passed 2 unit files / 5 tests.
- `npm run build` completed successfully with Next.js production optimization, type/lint validity checks, page-data collection, and static page generation.

Manual verification checklist:

1. Home page loads and shows URAI Storytime branding.
2. Create flow generates a safe local demo story.
3. Unsafe prompts are blocked with a family-safe message.
4. Replay route opens and narration controls render safely.
5. Library route lists locally saved stories.
6. Pricing clearly says billing is not launched.
7. Login/signup/dashboard/admin routes do not imply live auth.
8. Firebase-backed features remain launch-gated unless credentials, rules, and review are complete.
9. Privacy, Terms, Safety, robots.txt, sitemap.xml, favicon, and Open Graph assets load.

## Deployment

The app builds with Next.js. Production deployment must not proceed until:

1. `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e` pass in CI or a clean local checkout.
2. Firebase project aliases, Firestore rules, Storage rules, indexes, and Functions config are verified against the intended environment.
3. Auth, data deletion/export, consent, analytics privacy, billing, and moderation workflows are reviewed.
4. Live smoke checks pass against the deployed staging URL.
5. Legal/privacy approval is complete for family and child-related data handling.

## Generated artifacts

Do not commit generated test/build artifacts. `.gitignore` excludes Next build output, Playwright reports, and Playwright `test-results`.

## Security & privacy

- No secrets are required for local demo flows.
- Demo mode stores story data in browser local storage only.
- Prompt safety filtering is a demo precheck, not a complete production moderation system.
- Do not collect real child-sensitive information until production auth, consent, database rules, deletion/export, and safety review are complete.
- Production launch requires verified auth, database rules, deletion/export, consent, safety review, observability, and legal approval.
