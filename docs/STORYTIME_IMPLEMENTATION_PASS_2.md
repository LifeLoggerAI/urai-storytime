# URAI Storytime Implementation Pass 2

Date: 2026-05-19
Branch: `implementation/storytime-system-audit-2026-05-19`

## Purpose

Continue the system-of-systems completion pass for `urai-storytime` after the initial README/audit alignment PR.

## Implemented

### Asset-Factory lifecycle adapter

Updated `src/lib/storytime/asset-factory.ts` to cover more of the documented Storytime media generation lifecycle:

- Converts Storytime sessions and chapters into the Asset-Factory job input schema.
- Submits jobs to `POST /v1/jobs`.
- Normalizes `ASSET_FACTORY_BASE_URL` by removing a trailing slash.
- Requires `ASSET_FACTORY_API_KEY` and sends Bearer auth.
- Adds `getAssetFactoryJobStatus(jobId)` for polling `/v1/jobs/{job_id}`.
- Adds `toStorytimeAssetIngestionRecord(sessionId, status)` to convert Asset-Factory status into a Storytime ingestion record.

### Tests

Added `tests/unit/asset-factory-adapter.test.mjs`.

The test statically verifies:

- Asset-Factory Storytime schema fields.
- `/v1/jobs` submission endpoint.
- Bearer auth wiring.
- `/v1/jobs/{job_id}` polling endpoint.
- Storytime ingestion record fields.

## Still blocked

This pass does not prove live production media generation. Remaining blockers:

- Real Asset-Factory staging credentials.
- Live job submission evidence.
- Live job polling evidence.
- Completed bundle download evidence.
- Persistence of ingestion records into the final Firestore/Storage schema.
- UI/admin retry and failure handling.

## Verification status

No local checkout commands or deployments were run by this pass. CI should run on PR #12 and provide the next evidence point.

Required next commands:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run build

cd functions
npm install
npm run build
```
