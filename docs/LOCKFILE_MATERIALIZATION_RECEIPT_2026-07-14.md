# Storytime verified lock materialization receipt

Recorded: July 14, 2026

## Exact identities

- Repository: `LifeLoggerAI/urai-storytime`
- Validated source ancestor: `17f9581ac59f02383c55a5bcc12e8fc911702df3`
- One-time apply control head: `754a23e5618468bc9442b113a31a90338efad4e1`
- Self-cleaning materialization commit: `13ea0c84a3abce6a8e839888a192678c49fcae82`
- Root lock SHA-256: `29fd46b02f143ccca6623df1bd92cf6668d32cda710a5059cf84fed5a5da1c54`
- Functions lock SHA-256: `b57974a5ffb09591ff1e6957268a860df9b927c5e77261dd3ccd5eac0f70246c`

## Materialized paths

The self-cleaning commit changed only:

- added `package-lock.json`;
- added `functions/package-lock.json`;
- committed deterministic Next-generated `next-env.d.ts`;
- committed deterministic Next-generated `tsconfig.json` formatting and `{ "name": "next" }` plugin;
- deleted `.github/workflows/lockfile-repair-diagnostics.yml`.

The consumed workflow is absent from the accepted candidate. No permanent `contents: write` lock-materialization control remains.

## Verified source lane before materialization

The retained one-time apply artifact proved:

- exact lock hashes;
- frozen root and Functions installs;
- root lint/typecheck;
- 58 source/unit/E2E tests;
- 16 smoke tests;
- static security-rules validation;
- emulator configuration/runtime scaffold validation;
- production-readiness source validation;
- Next production build with eight static/SSG pages;
- Functions TypeScript build;
- zero provider calls;
- no deployment;
- no production-data mutation.

## Boundary

This receipt is source and dependency-reproducibility evidence only. It does not certify behavioral Firebase emulator authorization, live public-share expiration/revocation, provider-backed generation/TTS, queue workers, child-safety review, legal approval, protected staging, monitoring, rollback or production deployment.
