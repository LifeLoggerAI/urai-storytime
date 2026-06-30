# Data schema

## Core generation bundle

`generateStorySession` writes the following record bundle in one Firestore batch:

- `storySessions/{sessionId}`
- `storyChapters/{chapterId}`
- `storyMoments/{momentId}`
- `memoryScenes/{sceneId}`
- `narratorScripts/{scriptId}`
- `emotionalArcSummaries/{arcId}`

Common fields include `id`, `userId`, `sessionId` where relevant, timestamps, safety/provider markers, and relationships between records.

## Share records

`createPublicStoryShare` writes:

- `publicStoryShares/{shareId}` with `id`, `userId`, `sessionId`, `slug`, `title`, `safeSummary`, `safeBody`, `revoked`, timestamps.
- Updates source `storySessions/{sessionId}` with `publicShareId`, `visibility: public_safe`, and `updatedAt`.

`revokePublicStoryShare` updates:

- `publicStoryShares/{shareId}` with `revoked: true`, `revokedAt`, `updatedAt`.
- Source `storySessions/{sessionId}` with `visibility: private`, `publicShareId: null`, `updatedAt`.
- `timelineReplayEvents/{timelineEventId}` with revoke event metadata.

## Export/voiceover records

`prepareVoiceoverJob` writes:

- `voiceoverJobs/{voiceoverJobId}` with queued status and provider.
- `storyExports/{exportId}` with queued status and export type.
- `timelineReplayEvents/{timelineEventId}` with export queued metadata.

No worker-completed artifact record or Storage object proof was verified in this pass.

## Rule-protected collections observed

- Owner/admin: `storySessions`, `storyChapters`, `storyMoments`, `memoryScenes`, `narratorScripts`, `ritualStorycards`, `userStoryPreferences`, `storyExports`, `voiceoverJobs`, `timelineReplayEvents`, `emotionalArcSummaries`, `relationshipStoryThreads`, `weeklyStoryScrolls`, `monthlyStoryScrolls`.
- Public conditional: `publicStoryShares` readable only when `revoked == false`.
- Admin-only: `moderation`, `auditLogs` read path.
- Client-denied quota: `storytimeUsageCounters` read/write false.
- Privacy: `privacyRequests` self create/read and admin update.

## Persistence proof level

Source-present only. Live/emulator persistence proof was not available in this pass.
