# URAI Storytime feature truth table

Timestamp: 2026-06-28T2319Z

| Feature | Status after pass | Proof / limitation |
| --- | --- | --- |
| Demo story creation | Working/gated demo | `/storytime` still opens `/storytime/demo` when cloud/provider gates are not enabled. UI says Demo mode and Cloud generation unavailable. |
| Client validation | Implemented | Title, theme, age range, mood, max source length, and unsafe term checks added in `StorytimeHome`. |
| Cloud story creation UI | Production-wired but gated | Form calls Firebase callable `generateStorySession` only when Firebase client config, cloud mode, and provider readiness gate pass. Requires signed-in Firebase user. |
| Cloud provider generation | Production-wired but blocked until secrets/review | `functions/src/story-provider.ts` implements OpenAI JSON provider wrapper. `generateStorySession` requires provider readiness and safety consent before writing records. No secrets committed. |
| Deterministic cloud generation | Fail-closed in production | Functions no longer silently use deterministic output in production. Local deterministic function builder is only allowed when `STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER=true` and `NODE_ENV !== production`. |
| Saved session route | Real-capable gated | `/storytime/[sessionId]` now routes non-demo ids to `CloudSession`, which performs authenticated Firestore lookup when cloud config is ready. Full chapter/media hydration remains gated. |
| Story library/history | Gated partial | `SessionLibrary` lists signed-in user's saved sessions when cloud mode/auth/config are ready. Otherwise it explains the gate. |
| Public share route | Real-capable gated | `/share/story/[shareId]` routes non-demo ids to `ShareStory`, which fetches `publicStoryShares` when public sharing gate is ready and handles revoked/expired/not found/error states. |
| Public share creation UI | Not implemented | Callable exists. Owner UI to create/revoke share remains blocked. |
| Firestore rules/indexes | Existing scaffold | Rules/index files exist from prior baseline; not emulator-verified in this pass due no local checkout. |
| Deployment | Blocked by access/evidence | No Firebase target credentials or live URL verification available in this pass. |
| Build/test | Not locally verified | Container could not resolve github.com for checkout. GitHub Actions runs for latest commit were empty. Tests were updated but not executed here. |
