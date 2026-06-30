# Audit report

## Repo state

- Repository: `LifeLoggerAI/urai-storytime`
- Access: admin/push/maintain/pull/triage confirmed by GitHub connector metadata.
- Visibility: public.
- Default branch: `main`.
- Archived: false.
- Current pre-pass `main`: `5e880f82d2accdef18d4010627fbba7fbac627fd`.
- Prior proof commit requested for verification: `5e880f82d2accdef18d4010627fbba7fbac627fd`.
- Result: prior proof commit is current `main`.
- Prior proof folder exists: `launch-proof/urai-storytime-production-lock/2026-06-30T0000Z/`.
- Commits since observed source head `6426b5513c8db4db105b57b961037367f07cb931`: eight proof-doc commits only, adding the 2026-06-30T0000Z proof folder.

## Current framework/runtime

- Next.js 15, React 19, TypeScript.
- Firebase client/admin/functions dependencies present.
- Firebase Hosting frameworks backend region configured as `us-central1`.
- Firestore rules/indexes and Storage rules configured.
- Firebase emulator ports are configured for Auth, Functions, Firestore, Storage, Hosting, and UI.

## Current product classification

URAI Storytime is a production-wired prototype, not a static-only demo and not a verified production launch.

## Verified from source inspection

- Storytime create UI is present.
- Labeled deterministic demo flow is present.
- Cloud create path calls Firebase callable `generateStorySession` only when runtime gates pass.
- Auth panel supports Firebase email/password flows when client config exists.
- Cloud session reader queries saved session/chapter/scene/script/arc records.
- Public share reader queries `publicStoryShares` by slug and handles revoked/expired/not-found/error states.
- Callable Functions map covers generation, public share creation, share revocation, voiceover queue, timeline/archive hooks, narrator/emotional/weekly hooks.
- Provider adapter can call OpenAI only when required provider/model/key env is configured.
- Firestore rules have owner/admin boundaries and public-share revoked checks.

## Still unverified

- Real Firebase staging or production target.
- Local install/lint/typecheck/test/build receipts.
- CI statuses or workflow runs for current `main`.
- Emulator security rules proof.
- Deployed Firebase Functions proof.
- Controlled OpenAI-backed generation proof.
- Live Firestore persistence write/read proof.
- Public share create/fetch/revoke proof against deployed rules.
- Completed export/download/voiceover artifact proof.
- Child/minor/legal/privacy approval evidence.

## Verdict

PARTIAL. The source is materially production-shaped, but the product remains blocked from READY by missing runtime/deploy/provider/persistence/share/export/safety receipts.
