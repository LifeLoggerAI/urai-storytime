# Deployment and rollback

Last reconciled: 2026-07-06

## Current truth

No canonical Storytime staging/production Firebase project, deployed SHA, production URL, or rollback SHA is verified. `.firebaserc` remains a placeholder. `https://www.uraistorytime.com` is a target named in documentation, not live evidence.

## Promotion order

1. Green required checks on the exact candidate SHA.
2. Download and retain the verification receipt artifact.
3. Verify isolated Storytime Firebase project IDs and aliases.
4. Run executable Auth/Firestore/Storage emulator behavior tests.
5. Deploy rules/indexes to staging.
6. Deploy Functions to staging.
7. Deploy Hosting to staging.
8. Run authenticated generation, persistence, authorization, sharing, deletion/export, mobile, and accessibility smoke tests.
9. Record provider/cost receipts for a controlled synthetic request only.
10. Obtain privacy/child-safety/legal/product approvals required by the enabled feature set.
11. Promote the same tested SHA/config to production.
12. Run post-deploy domain/DNS/SSL and core journey smoke tests.

## Preflight

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm --prefix functions run build
npm run emulators:test
npm run validate:release-promotion
```

`validate:release-promotion` must remain red until real production configuration/evidence exists.

## Staging deploy

Only after replacing placeholders with the approved isolated target:

```bash
firebase use <storytime-staging-alias>
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only storage
firebase deploy --only functions
firebase deploy --only hosting
```

Record CLI output, project ID, hosting URL, deployed SHA, rules/index version, Functions revision, timestamp, operator, and smoke results. Never paste secret values into the receipt.

## Production deploy

Production requires explicit approval. Deploy the exact SHA tested in staging:

```bash
firebase use <storytime-production-alias>
npm run validate:release-promotion
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only storage
firebase deploy --only functions
firebase deploy --only hosting
```

Do not enable cloud generation, public sharing, TTS, image, or video generation merely because code deployed. Each feature flag has an independent receipt and cost/privacy gate.

## Required live smoke

- `/` redirects to `/storytime`.
- `/storytime`, `/storytime/settings`, `/storytime/demo`, and public demo return successfully.
- Auth create/verify/sign-in/reset/sign-out works.
- Synthetic story generation creates one complete version and readback is owner-only.
- Non-owner direct and query access fails.
- Public share create/open/revoke/expire works and private records are never returned.
- Export/delete/retention behavior matches enabled claims.
- Logs contain IDs/status only, not prompt/story/private content.
- Mobile and accessibility checks pass.
- DNS, SSL, canonical redirects, robots/indexing, security headers, and cache behavior are verified.

## Rollback

Before promotion, record:

- candidate SHA;
- previous deployed SHA;
- previous Hosting release/version;
- previous Functions revisions;
- rules/index migration compatibility;
- rollback owner and command plan.

Rollback order depends on incident type:

1. disable affected feature flag/provider to stop spend or exposure;
2. revoke public sharing if its boundary is involved;
3. roll back Hosting/Functions to the recorded known-good release;
4. restore compatible rules only after confirming data-model compatibility;
5. do not destructively reverse data migrations without a tested recovery plan;
6. run smoke tests and record incident evidence.

A source commit is not a rollback SHA until it has been successfully deployed and tested in the same environment.

## Incident and stop conditions

Stop deployment immediately for:

- wrong Firebase project/alias;
- failing required check;
- missing receipt or unreviewed code difference from staging;
- unauthorized data read/write;
- raw private data in logs/errors;
- provider call without budget/consent/idempotency;
- public revoked/expired share still readable;
- missing backup/rollback path;
- legal/privacy/child-safety gate not approved for an enabled claim.
