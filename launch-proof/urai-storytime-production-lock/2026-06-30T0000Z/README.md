# URAI Storytime production lock due diligence

Timestamp: 2026-06-30T0000Z
Repo: `LifeLoggerAI/urai-storytime`
Branch inspected: `main`
Head observed through GitHub code search/fetch results: `6426b5513c8db4db105b57b961037367f07cb931`

## Verdict

PARTIAL / NOT READY FOR PUBLIC PRODUCTION.

URAI Storytime is no longer only a static scaffold. It has a Next.js/Firebase product shell, demo story flow, gated Firebase Auth UI, callable generation/share/voiceover lifecycle functions, Firestore persistence writes, public-share fetch/revoke paths, safety/redaction helpers, rules, indexes, deployment scripts, and smoke/static tests. However, it is not verified as a real live production Storytime product because production Firebase target values are placeholders, no live deployment evidence is recorded for this pass, no GitHub Actions run exists for the observed head, provider secrets/model are not verified, and no emulator/live cloud smoke proof was produced.

Readiness score: 62/100.

## Production boundary

Do not market Storytime as live production AI generation, persistent sessions, public sharing, export/download, child-safe production, or deployed Storytime until the blockers in `blockers.md` are closed with evidence.

Safe claim: prototype with production wiring and honest runtime gates.

Unsafe claim: fully launched production Storytime.

## Files in this proof folder

- `audit-report.md`
- `route-map.md`
- `function-map.md`
- `data-schema.md`
- `build-test-deploy-proof.md`
- `blockers.md`
- `completion-plan.md`

## Final lock

Keep demo-only flows labeled. Keep cloud generation blocked unless Firebase client config, Firebase Functions deployment, Auth, provider readiness, and safety review are all verified. Keep public sharing blocked unless real public-share create/fetch/revoke behavior is smoke-tested against deployed rules and indexes.
