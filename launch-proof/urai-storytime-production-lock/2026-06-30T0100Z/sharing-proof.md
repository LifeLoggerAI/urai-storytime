# Sharing proof

## Classification

Sharing readiness: 56/100.

Current classification: SOURCE-PRESENT ONLY / PARTIAL.

## Source-present evidence

- `createPublicStoryShare` requires signed-in user and explicit consent.
- `createPublicStoryShare` reads an owned session and writes a redacted public-share record.
- `ShareStory` fetches `publicStoryShares` by slug and handles not-found, revoked, expired, error, and ready states.
- `ShareControls` calls create and revoke callables from the cloud session UI.
- `revokePublicStoryShare` requires signed-in owner, marks share revoked, resets session visibility private, clears `publicShareId`, and records a timeline event.
- Firestore rules allow public read only when `revoked == false`.

## Missing proof

- No emulator public share create/fetch/revoke test was run in this pass.
- No live share was created, fetched, revoked, and re-fetched in this pass.
- No non-owner revoke/update denial proof exists in this pass.
- No redaction robustness test exists in this pass.
- No proof that expired shares are written with `expiresAt`; route handles expiry but creation currently does not appear to set expiration.

## Current verdict

Sharing is production-shaped but not production-proven. Keep public sharing gated until deployed rules and callable smoke tests pass.

## Acceptance criteria for upgrade

1. Create controlled private story session.
2. Create public-safe share with explicit consent.
3. Confirm public route renders only `title`, `safeSummary`, and `safeBody`.
4. Confirm private story body is never exposed publicly.
5. Revoke share.
6. Confirm public route no longer renders revoked share.
7. Confirm non-owner cannot revoke or update share.
8. Add share expiration creation policy or explicitly document no expiration.
