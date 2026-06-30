# Persistence proof

## Classification

Persistence readiness: 58/100.

Current classification: SOURCE-PRESENT ONLY / PARTIAL.

## Source-present evidence

- `generateStorySession` constructs and batch-writes session, chapter, moment, scene, narrator script, and emotional arc records.
- `CloudSession` reads `storySessions`, queries `storyChapters`, `memoryScenes`, `narratorScripts`, and reads `emotionalArcSummaries` by id.
- `SessionLibrary` queries signed-in user's `storySessions` ordered by `createdAt`.
- Firestore rules include owner/admin boundaries for Storytime records.
- `storytimeUsageCounters` are denied to client reads/writes.

## Missing proof

- No emulator write/read test was run in this pass.
- No deployed callable created a real session in this pass.
- No live Firestore record was read back by the same owner in this pass.
- No non-owner denial test was run in this pass.
- No deletion/export/privacy request completion proof exists in this pass.

## Current verdict

The persistence path is credible source code, but it is not verified live or emulator-verified in this pass.

## Acceptance criteria for upgrade

1. Run emulator test creating a user and story session.
2. Confirm generated record bundle exists.
3. Confirm owner can read session bundle.
4. Confirm another user cannot read private session bundle.
5. Confirm Firestore indexes support library/session queries.
6. Confirm privacy request/delete/export behavior is implemented and tested.
7. Record sanitized command logs and Firestore proof screenshots or JSON summaries.
