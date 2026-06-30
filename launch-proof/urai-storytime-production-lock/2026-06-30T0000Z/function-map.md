# Function map

## Firebase callable functions

| Function | Status | Classification | Notes |
|---|---:|---:|---|
| `generateStorySession` | Implemented in code | PARTIAL | Requires auth, story generation consent, moderation screen, quota enforcement, configured provider or explicit non-production deterministic override. Writes session/chapter/moment/scene/script/arc docs. No live function smoke proof in this pass. |
| `createPublicStoryShare` | Implemented in code | PARTIAL | Requires auth and explicit consent, checks owned session, writes redacted `publicStoryShares`, updates session visibility. No live smoke proof. |
| `revokePublicStoryShare` | Implemented in code | PARTIAL | Requires auth, verifies share owner, sets revoked, resets session visibility to private, writes timeline event. No live smoke proof. |
| `prepareVoiceoverJob` | Implemented in code | PARTIAL/GATED | Requires auth, owned session, voiceover consent, narrator script id. Queues `voiceoverJobs` and `storyExports`; does not prove completed media/export generation. |
| `generateNarratorScript` | Hook only | MOCK/PARTIAL | Auth required, returns queued hook message. Does not generate persisted script independently in this function. |
| `generateEmotionalArcSummary` | Hook only | MOCK/PARTIAL | Auth required, returns queued hook message. |
| `generateWeeklyStoryScroll` | Hook only | MOCK/PARTIAL | Auth required, returns queued hook message. |
| `refreshStoryTimeline` | Hook only | MOCK/PARTIAL | Auth required, returns queued hook message. |
| `rebuildUserStoryArchive` | Hook only | MOCK/PARTIAL | Auth required, returns queued hook message. |

## Provider map

| Provider component | Status | Classification | Notes |
|---|---:|---:|---|
| `story-provider.ts` OpenAI adapter | Code present | PARTIAL | Calls OpenAI chat completions with JSON response format only when provider/model/API key are configured. No secret or live provider proof in this pass. |
| Deterministic function fallback | Code present | GATED | Allowed only when `STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER=true` and `NODE_ENV !== production`. This must not be represented as real AI generation. |

## Audit logging

Functions emit audit events for generation request/block/failure/persist, public share create/revoke, quota block, and voiceover export queued. Audit logging must remain privacy-safe and avoid raw prompts/story bodies.

## Function launch boundary

Code is production-shaped, but function status is not production-verified. Before claiming live generation or sharing, run deployed callable smoke tests with controlled non-sensitive data and record request/response, Firestore writes, rules behavior, and rollback path.
