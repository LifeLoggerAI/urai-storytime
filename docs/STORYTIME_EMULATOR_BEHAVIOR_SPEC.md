# URAI Storytime emulator behavior proof spec

This document defines the executable Firebase authorization proof required before URAI Storytime can move from source-present security controls to staging/runtime authority.

The emulator suite uses **synthetic identities and synthetic records only**. It does not establish production IAM, deployed revision identity, legal/privacy approval, or provider readiness.

## Test identities

- `ownerUser`: owns a private Storytime session.
- `otherUser`: must be denied access to owner-private records.
- `adminUser`: synthetic emulator-only `admin: true` claim.
- `signedOut`: unauthenticated context.
- family Storage identities use synthetic `familyIds` claims.

## Current Firestore authority matrix

### Required allow cases

1. Owner can create private Storytime records with their own `userId` where client creation is intentionally permitted.
2. Owner can read/update permitted fields on their own private Storytime records.
3. Admin can read/write the dedicated moderation collection.
4. Owner can read their own server-created privacy-request record.
5. Admin can update a privacy-request workflow state.
6. Owner can create append-only Storytime analytics events.
7. Anonymous users can read only active, non-revoked, non-expired `public-story-share-v2` derivatives that contain no owner/session identifiers.

### Required deny cases

1. Signed-out and cross-user clients cannot read private Storytime sessions.
2. Cross-user clients cannot read owner chapters, moments, memory scenes, narrator scripts, or emotional arcs.
3. Owners cannot mint or rewrite server-owned moderation/safety fields on Storytime sessions.
4. All clients, including admin-token clients, are denied direct access to server-only:
   - `storytimeUsageCounters`
   - `storyGenerationRequests`
   - `storyArchiveSnapshots`
   - `privacyDeletionPlans`
   - privacy operation/completion receipt collections
5. Non-admin users cannot read/write moderation records.
6. Privacy requests are **server-created**; owners can read their own request but cannot create/update/delete it directly.
7. Append-only analytics records cannot be updated/deleted by clients.
8. Public-share records are **server-created**; every client write is denied.
9. Revoked, expired, malformed, wrong-schema, or legacy owner/session-leaking public shares are unreadable.

## Current Storage authority matrix

1. Family story assets are readable/writable only by identities carrying the matching synthetic `familyIds` claim or admin.
2. Cross-family access is denied.
3. Family export assets are readable by the matching family claim but writable only by admin.
4. Moderation storage is admin-only.
5. Every unspecified Storage path is denied by default.

These tests prove the current rule contract only. They do not prove how production custom claims are issued or revoked.

## Server-owned lifecycle truth

The emulator specification must not reintroduce obsolete client authorities.

Current Storytime source intentionally makes these server-owned or hard-off:
- public share creation/revocation mutation;
- privacy request creation;
- generation receipts and usage counters;
- archive snapshots;
- deletion plans and completion receipts;
- moderation authority;
- voiceover/media execution while no governed media worker exists.

## Exact-head workflow

`.github/workflows/public-share-rules-emulator.yml` runs the authorization matrix on every pull request whose relevant rules/harness paths change, including stacked PRs.

The workflow:
- checks out the exact candidate SHA;
- uses no production credentials;
- starts isolated Firestore + Storage emulators;
- executes both public-share and broader authorization matrices;
- records rules/config hashes and dependency evidence;
- retains sanitized emulator logs and a receipt;
- resets generated files;
- proves the final source tree is still the exact clean candidate;
- fails if the emulator matrix fails.

## Evidence requirements

The retained artifact must identify:
- repository;
- exact candidate SHA;
- workflow run ID;
- synthetic emulator project ID;
- Firebase emulator config;
- Firestore/Storage rule hashes;
- allow/deny matrix;
- exit code;
- no production credentials;
- no deployment;
- no real personal data.

## Readiness boundary

A passing emulator receipt proves behavior of the checked-in Firestore/Storage rules against synthetic emulator fixtures.

It does **not** prove:
- production custom-claim issuance/revocation;
- production Auth configuration;
- production Firebase project identity;
- deployed rules revision;
- WIF/IAM;
- live provider behavior;
- child/family legal compliance;
- monitoring/rollback.

Those remain separate exact-environment gates.
