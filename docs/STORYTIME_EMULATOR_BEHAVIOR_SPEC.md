# URAI Storytime emulator behavior proof spec

This document defines the behavioral Firebase emulator proof required before URAI Storytime can move from PARTIAL to READY.

The current repo has static source checks for rules, routes, functions, provider gates, and production boundaries. This spec defines the next required behavioral checks that must be run in Firebase emulators or an isolated staging Firebase project with non-sensitive test data.

## Required test identities

Use only synthetic users:

- `ownerUser`: creates a private Storytime session and public share.
- `otherUser`: attempts to read or modify owner-only records and must be denied.
- `adminUser`: has an admin custom claim only in emulator/staging tests.
- `signedOut`: unauthenticated request and must be denied for private records.

## Required Storytime records

Use synthetic records only. Do not use real user memories, child data, names, addresses, school names, phone numbers, or private story text.

Required fixture bundle:

- `storySessions/{sessionId}` with `userId: ownerUser.uid`, `visibility: private`, and a synthetic title.
- `storyChapters/{chapterId}` with `userId: ownerUser.uid` and `sessionId`.
- `storyMoments/{momentId}` with `userId: ownerUser.uid` and `sessionId`.
- `memoryScenes/{sceneId}` with `userId: ownerUser.uid` and `sessionId`.
- `narratorScripts/{scriptId}` with `userId: ownerUser.uid` and `sessionId`.
- `emotionalArcSummaries/{arcId}` with `userId: ownerUser.uid` and `sessionId`.
- `publicStoryShares/{shareId}` with `userId: ownerUser.uid`, `sessionId`, `slug`, `title`, `safeSummary`, `safeBody`, and `revoked: false`.
- `voiceoverJobs/{jobId}` and `storyExports/{exportId}` with queued status only.

## Required allow cases

1. Owner can create private Storytime records with `userId` equal to owner UID.
2. Owner can read their own `storySessions` bundle records.
3. Owner can update their own `storySessions` visibility and public share pointer.
4. Owner can create a public-safe share with safe fields and `revoked: false`.
5. Public/signed-out users can read a non-revoked public share record.
6. Owner can revoke their own public share.
7. Owner can create queued `voiceoverJobs` and `storyExports` records when the flow is explicitly consented at the callable layer.
8. Admin can read/write moderation records.
9. Admin can read audit logs.
10. Owner can create a privacy request for self.

## Required deny cases

1. Signed-out users cannot read private `storySessions` records.
2. `otherUser` cannot read owner private `storySessions`, `storyChapters`, `storyMoments`, `memoryScenes`, `narratorScripts`, or `emotionalArcSummaries` records.
3. `otherUser` cannot update/delete owner private records.
4. Client cannot read or write `storytimeUsageCounters`.
5. Public/signed-out users cannot read a revoked public share.
6. Client-created public share records must not contain private story body fields.
7. Client-created public share records must not set `revoked: true` at create time.
8. Non-admin users cannot read moderation records.
9. Non-admin users cannot read audit logs.
10. Users cannot delete `users`, `families`, `childProfiles`, `stories`, `storyRuns`, `privacyRequests`, or append-only analytics/audit records.
11. Storage paths must deny by default outside explicit owner/admin story/export paths.
12. `otherUser` cannot read owner export or voiceover artifacts.

## Required proof output

Each emulator run must save sanitized output under a new proof folder:

`launch-proof/urai-storytime-production-lock/<timestamp>/command-logs/emulator-behavior.log`

The proof must include:

- command run
- emulator project id
- pass/fail result
- list of allow cases passed
- list of deny cases passed
- any skipped cases with reason
- no secrets
- no real personal data

## Readiness boundary

Until these behavioral checks pass, Firestore and Storage rules remain source-present only. Storytime must not claim live persistence, owner-only privacy enforcement, public share revoke enforcement, or export artifact protection as production-ready.
