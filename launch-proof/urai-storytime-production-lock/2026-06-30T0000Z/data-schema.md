# Data schema and persistence audit

## Primary Firestore collections observed in rules/functions/client code

| Collection | Purpose | Access boundary | Status |
|---|---|---|---:|
| `users` | User documents | Self read/create/update; no delete | PARTIAL |
| `families` | Family membership/guardian model | Family member/manager/admin | PARTIAL |
| `childProfiles` | Child profile records | Family manager/admin | RISK/PARTIAL: child-safety review required |
| `stories` | Legacy/family story records | Family member/manager/admin | PARTIAL |
| `storyRuns` | Legacy/family story run records | Family member create/read, no update/delete | PARTIAL |
| `storySessions` | Main Storytime session records | Owner/admin | PARTIAL: callable writes; live proof missing |
| `storyChapters` | Session chapters | Owner/admin | PARTIAL |
| `storyMoments` | Story moments | Owner/admin | PARTIAL |
| `memoryScenes` | Symbolic scene records | Owner/admin | PARTIAL |
| `narratorScripts` | Narrator script records | Owner/admin | PARTIAL |
| `emotionalArcSummaries` | Arc summary records | Owner/admin | PARTIAL |
| `publicStoryShares` | Redacted public share records | Public read only when `revoked == false`; owner/admin update/delete | PARTIAL: create/fetch/revoke code exists, live proof missing |
| `voiceoverJobs` | Queued voiceover/media job records | Owner/admin | PARTIAL: queue only, no processor proof |
| `storyExports` | Export records | Owner/admin | PARTIAL: queue only, no file/download proof |
| `timelineReplayEvents` | Story timeline events | Owner/admin | PARTIAL |
| `storyAnalyticsEvents` | Analytics events | Owner create/read, no update/delete | PARTIAL |
| `storytimeUsageCounters` | Quota counters | Client read/write denied | DONE boundary; function/admin use only |
| `moderation` | Moderation records | Admin only | PARTIAL: no admin UI confirmed |
| `auditLogs` | Audit records | Admin read; signed-in create; no update/delete | PARTIAL |
| `privacyRequests` | User privacy request records | User/admin | PARTIAL: full deletion/export flow not verified |

## Main generation write bundle

`generateStorySession` creates a single batch containing:

- `storySessions/{sessionId}`
- `storyChapters/{chapterId}`
- `storyMoments/{momentId}`
- `memoryScenes/{sceneId}`
- `narratorScripts/{scriptId}`
- `emotionalArcSummaries/{arcId}`

It stores `userId`, consent snapshot, safety status, provider marker, source signal metadata, timestamps, and IDs linking the generated records.

## Public share persistence

`createPublicStoryShare` writes `publicStoryShares/{shareId}` with safe/redacted fields and `revoked: false`, then updates the source session with `publicShareId` and `visibility: public_safe`.

`revokePublicStoryShare` updates the share to `revoked: true`, sets `revokedAt`, resets the session to `visibility: private`, clears `publicShareId`, and writes a timeline event.

## Storage

Storage rules allow family story assets and export paths under `families/{familyId}/stories/...` and `families/{familyId}/exports/...`, plus admin-only moderation files. No completed Storytime export/download artifact was verified in this pass.

## Persistence verdict

Persistence is code-wired but not production-verified. The next lock requires emulator or live tests proving owner-only create/read/update, public revoked-share denial, quota counter protection, and export asset boundaries.
