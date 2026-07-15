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

## Retained deterministic modules

Some `.mjs` modules under `src/` remain because current unit tests and validators use them as bounded deterministic-demo or readiness adapters. Their presence does not authorize a second frontend. They must not introduce an HTML entrypoint, hash router, independent Hosting root, or deployment command.

## Fail-closed authority

`tests/e2e/canonical-app-root.test.mjs` enforces:

1. the three obsolete entrypoint files remain absent;
2. root scripts remain Next.js commands;
3. Firebase Hosting remains the frameworks backend;
4. no active package script serves or deploys a static `src/` directory;
5. the canonical route/UI/functions directories remain present.

## Classification

This change is repository hygiene and source-of-truth containment only. It does not deploy Storytime, enable providers or public sharing, migrate data, change credentials, create billing, or certify production readiness.
