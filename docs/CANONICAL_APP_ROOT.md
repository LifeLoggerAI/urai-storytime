# URAI Storytime canonical application root

Recorded: 2026-07-15

## Authoritative runtime

The only active URAI Storytime application is the Next.js/Firebase internal-alpha implementation:

- routes: `src/app/**`
- Storytime UI: `src/components/storytime/**`
- browser/domain adapters: `src/lib/**`
- callable backend: `functions/src/**`
- Firebase application configuration: `firebase.json`
- application commands: root `package.json`

Root commands use `next dev`, `next build`, and `next start`. Firebase Hosting uses the Next.js frameworks backend. No static HTML/hash-router entrypoint is an authorized build, preview, Hosting, deployment, or product-claim surface.

## Removed obsolete entrypoints

The incomplete static/hash-router files below were removed from the active tree:

- `src/index.html`
- `src/app.js`
- `src/styles.css`

Their historical contents remain available through Git history. They are not copied into a deployable archive because the old `app.js` was incomplete and would preserve an ambiguous alternate product surface.

## Archived deterministic demo engine

The obsolete direct-child bedtime demo engine has been moved from `src/story-engine.mjs` to `legacy/static-demo/story-engine.mjs`.

It remains only as historical/test evidence. It is not an active domain adapter, provider, safety engine, frontend, build input, Hosting root, or production Storytime capability.

Current launch Storytime generation authority lives in the Next.js/Firebase application and its governed server/provider contracts.

## Fail-closed authority

`tests/e2e/canonical-app-root.test.mjs` enforces:

1. the obsolete static entrypoint files and `src/story-engine.mjs` remain absent;
2. root scripts remain Next.js commands;
3. Firebase Hosting remains the frameworks backend;
4. no active package script serves or deploys a static `src/` directory;
5. the canonical route/UI/functions directories remain present.

## Classification

This change is repository hygiene and source-of-truth containment only. It does not deploy Storytime, enable providers or public sharing, migrate data, change credentials, create billing, or certify production readiness.
