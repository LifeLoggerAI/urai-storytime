# Testing strategy and commands

Last reconciled: 2026-07-06

## Truth labels

- **Unit/behavior test:** executes code and asserts outcomes.
- **Source smoke test:** reads source files and asserts expected markers.
- **Emulator behavior test:** executes Firebase rules/functions against emulators.
- **Browser E2E:** drives a real browser through user journeys.
- **Live smoke:** tests a deployed environment and records URL/SHA/time.

The current `test:e2e` command aliases the source-inspection smoke test. It must not be represented as real browser E2E.

## Current commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run test:e2e
npm run test:env-template
npm run test:security-rules
npm run test:emulator-scaffold
npm run test:emulator-runtime
npm run test:emulator-behavior-spec
npm run test:provider-wiring
npm run test:production-config
npm run test:production-evidence
npm run test:production-smoke
npm run test:production-readiness
npm run build
npm --prefix functions run build
```

`npm run test:production-config`, evidence, and smoke are expected to fail or remain blocked when real release receipts are absent. Do not weaken them to create a green result.

## Required P0 additions

### Firebase emulator behavior

Cover at least:

- signed-out access denied;
- owner reads/writes intended private records;
- non-owner denied by document and query;
- guardian/viewer role matrix;
- admin access requires trusted custom claim;
- users cannot forge authoritative audit events;
- usage counters are server-only;
- public active share readable anonymously;
- revoked and expired shares unreadable;
- share owner can revoke; other user cannot;
- family Storage claims and path ownership;
- malformed or privilege-escalating writes denied.

### Generation Functions

Cover:

- authentication and explicit consent;
- age/policy validation;
- hourly/daily quota race behavior;
- idempotency and duplicate retry;
- provider timeout, retry exhaustion, malformed JSON, missing fields;
- input and output moderation;
- no partial record marked ready;
- provider/cost/provenance receipt persistence;
- private error mapping.

Provider unit tests must mock network calls and must not spend money.

### Browser E2E

Use a real browser runner for:

1. deterministic demo create/read flow;
2. account create/verify/sign-in/reset/sign-out;
3. private cloud generation and library readback in staging;
4. owner/non-owner session access;
5. public share create/open/revoke/expire;
6. settings/export/delete flows;
7. loading, empty, error, retry, and offline states;
8. mobile/tablet/desktop viewports.

### Accessibility

Automate axe checks and manually verify:

- keyboard-only navigation;
- focus order/visibility;
- screen-reader names and announcements;
- headings/landmarks/forms/errors;
- contrast and 200%/400% zoom;
- reduced motion;
- captions/transcripts and playback controls;
- touch target sizing.

### Security and dependency tests

- dependency audit and update policy;
- secret scanning;
- code scanning/static analysis;
- Content Security Policy review;
- App Check/rate-abuse tests;
- upload type/size/malware/metadata tests before uploads launch;
- prompt-injection and data-exfiltration fixtures;
- log-scrubbing assertions.

### Performance

Set release budgets for:

- route JavaScript and CSS;
- LCP/INP/CLS;
- story-library query count/latency;
- large story rendering;
- audio/image streaming;
- Functions cold start and provider timeout;
- media job polling/backoff.

## Release evidence

Every release candidate record must include:

- exact repository SHA and branch;
- workflow run IDs and artifacts;
- Node/npm versions and lockfile hash;
- test command matrix with pass/fail/blocked;
- emulator project and test fixture version;
- staging/production URLs and Firebase project IDs (non-secret);
- deployed and rollback SHAs;
- browser/device/accessibility matrix;
- provider smoke request ID and sanitized cost receipt;
- unresolved risks and approving owner.
