# Local development

Last reconciled: 2026-07-06

## Prerequisites

- Node.js 24, matching CI and `functions/package.json`.
- npm.
- Firebase CLI for emulator/deploy work.
- Java runtime required by Firebase emulators.

The repository currently has no committed root or Functions lockfile. Until P0 reproducibility work commits lockfiles, use `npm install`; do not describe the install as deterministic.

## Install

```bash
npm install
npm --prefix functions install
cp .env.example .env.local
```

Leave cloud/provider/public-sharing flags false for ordinary local work. Never commit `.env.local`, service-account keys, private keys, API keys, or provider receipts containing secrets.

## Run deterministic demo

```bash
npm run dev
```

Open `/storytime` and use the labeled demo path. Demo sessions are generated locally and are not account persistence or provider proof.

## Run Firebase emulators

```bash
npm run emulators:start
```

For emulator work, use synthetic accounts and synthetic story content only. Do not enter real child, family, voice, photo, health, school, location, or memory data.

## Functions

```bash
npm --prefix functions run build
```

Functions should remain blocked from real provider calls unless an explicitly approved staging environment has secrets, a hard budget, and a controlled test plan.

## Before committing

```bash
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run test:security-rules
npm run test:emulator-scaffold
npm run test:emulator-runtime
npm run test:emulator-behavior-spec
npm run test:provider-wiring
npm run test:production-readiness
npm run build
npm --prefix functions run build
```

Static emulator validators are not a substitute for executed behavior tests. Record which commands actually ran and which were unavailable.

## Branching

- Do not develop substantive changes directly on `main`.
- Use focused branches and commits.
- Never weaken production gates to make CI green.
- Do not add a provider key, enable paid media generation, or deploy production without explicit approval.
