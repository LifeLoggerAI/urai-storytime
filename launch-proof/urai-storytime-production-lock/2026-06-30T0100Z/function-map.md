# Function/API map

## Callable Functions

| Function | Trigger | Auth | Consent | Validation | Safety/moderation | Provider dependency | Reads/writes | Output | Quota/logging | Status | Proof required |
|---|---|---:|---:|---|---|---|---|---|---|---:|---|
| `generateStorySession` | Firebase callable | Required | `consentSnapshot.storyGeneration` required | Zod schema | Basic blocked terms; provider error handling | OpenAI provider only when env ready; local builder only non-production override | Writes `storySessions`, `storyChapters`, `storyMoments`, `memoryScenes`, `narratorScripts`, `emotionalArcSummaries` | `{ sessionId, status, safetyStatus, provider }` | Hour/day quota counters, audit events | PARTIAL | Deployed callable smoke, provider-backed generation, persisted readback, owner-only rules. |
| `createPublicStoryShare` | Firebase callable | Required | Explicit `consent: true` | Zod inline schema | Regex redaction for title/summary; safe placeholder body | None | Reads owned session; writes `publicStoryShares`; updates session visibility/share id | `{ shareId, slug }` | Audit event | PARTIAL | Owner create, public fetch, non-owner deny, revoked denial proof. |
| `revokePublicStoryShare` | Firebase callable | Required | Existing owner action | Zod schema | N/A | None | Reads share; updates share `revoked`; updates session private; writes timeline event | `{ status: revoked, shareId }` | Audit event | PARTIAL | Owner revoke and public route no-longer-displays proof. |
| `prepareVoiceoverJob` | Firebase callable | Required | `consentSnapshot.voiceover === true` | Zod schema | Requires existing narrator script | Asset Factory/TTS provider label only | Reads owned session; writes `voiceoverJobs`, `storyExports`, `timelineReplayEvents` | `{ status: queued, voiceoverJobId, exportId, provider }` | Audit event | PARTIAL/BLOCKED | Worker processing, artifact creation, Storage rule/download proof. |
| `generateNarratorScript` | Firebase callable | Required | Not verified beyond auth | Not fully verified in this pass | None confirmed beyond hook | Unknown | Returns queued message | Queued hook | None confirmed beyond auth | MOCK/PARTIAL | Real generation/persistence proof. |
| `generateEmotionalArcSummary` | Firebase callable | Required | Not verified beyond auth | Not fully verified | None confirmed beyond hook | Unknown | Returns queued message | Queued hook | None confirmed beyond auth | MOCK/PARTIAL | Real summary generation/persistence proof. |
| `generateWeeklyStoryScroll` | Firebase callable | Required | Not verified beyond auth | Not fully verified | None confirmed beyond hook | Unknown | Returns queued message | Queued hook | None confirmed beyond auth | MOCK/PARTIAL | Real weekly scroll generation/persistence proof. |
| `refreshStoryTimeline` | Firebase callable | Required | Not verified beyond auth | Not fully verified | None confirmed beyond hook | None | Returns queued message | Queued hook | None confirmed beyond auth | MOCK/PARTIAL | Real timeline refresh implementation/proof. |
| `rebuildUserStoryArchive` | Firebase callable | Required | Not verified beyond auth | Not fully verified | None confirmed beyond hook | None | Returns queued message | Queued hook | None confirmed beyond auth | MOCK/PARTIAL | Real archive rebuild implementation/proof. |

## API routes

No Next.js API routes were verified in this pass. Backend surface is Firebase callable Functions.

## Function launch boundary

The generation/share/voiceover functions are source-present and production-shaped but not production-proven. Hook-only functions must not be described as finished features.
