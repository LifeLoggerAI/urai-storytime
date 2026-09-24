# Privacy Operations Architecture

## Current State

Storytime now has a bounded source implementation for privacy requests, private export packaging, short-lived signed export retrieval, deletion dry-run planning, admin-only destructive execution, and post-delete verification.

This is **not production certification**. Runtime completion still depends on exact-head CI, isolated Firebase staging/production authority, authenticated emulator/staging proof, reviewed retention/legal-hold policy, and cross-system provider/media cleanup evidence.

## Authority

- URAI Privacy remains the ecosystem privacy control-plane authority.
- Storytime implements only its Storytime-owned operational slice.
- Storytime does not silently delete family/shared records, provider-held media, or another repository's authority.
- Request creation does not equal export/deletion completion.

## Export lifecycle

1. Verified user creates a Storytime privacy request.
2. `processStorytimeExportRequest` inventories Storytime-owned records for the request scope.
3. Sensitive secret/token-style fields are scrubbed.
4. The JSON package and integrity manifest are written to private Storage.
5. A completion receipt records package and manifest hashes.
6. The owner may request a short-lived signed URL through `getStorytimeExportDownloadUrl`.
7. If family/shared authority or external provider artifact cleanup remains unresolved, the export is labeled `partial_review_required` and the request remains in review rather than being falsely marked complete.

## Deletion lifecycle

1. Verified user creates a deletion request.
2. `planStorytimeDeletion` performs a dry-run inventory and produces a stable plan hash.
3. The plan checks legal hold, family/shared ownership ambiguity, Firebase isolation, provider/media references, and backup-retention readiness.
4. Destructive execution is **admin-only** through `executeStorytimeDeletion`.
5. Execution requires the exact current plan hash and explicit confirmation string `DELETE_STORYTIME_DATA`.
6. The executor re-plans immediately before mutation; changed targets invalidate the old plan.
7. Account deletion is blocked unless `STORYTIME_FIREBASE_ISOLATED=true`.
8. Family/child/shared authority blocks account deletion until URAI Privacy review resolves ownership.
9. Storytime media/export/voiceover records block deletion until media/storage/provider cleanup is certified.
10. After mutation, the request enters `verification_required`.
11. `verifyStorytimeDeletion` confirms Storytime-owned targets and Auth state are actually gone.
12. Final `completed` state remains blocked until `STORYTIME_BACKUP_RETENTION_POLICY_READY=true`.
13. Plans, privacy requests, legal-hold evidence, and completion receipts remain retained privacy evidence.

## Server-only evidence

The following collections are not directly readable/writable by clients:

- `privacyDeletionPlans`
- `privacyCompletionReceipts`
- `storyGenerationRequests`
- `storyArchiveSnapshots`

Users interact through verified callable functions rather than forging lifecycle state.

## Family and child boundary

Storytime is currently adult/guardian-operated. Family membership or child-profile authority is not silently collapsed into account ownership. If an account participates in a family/shared authority graph, destructive account deletion fails closed until the cross-system privacy decision is explicitly resolved.

## Provider and media boundary

A Storytime record referencing external provider/media artifacts is not enough to prove those artifacts were deleted. Any Storytime media/export/voiceover state creates a deletion blocker until the external storage/provider deletion contract is certified.

## Required remaining proof

Production privacy readiness still requires:

- exact-head app and Functions CI;
- emulator/staging owner/non-owner/admin behavior;
- isolated Storytime Firebase identity;
- real Storage package/signed-URL receipt;
- deletion dry-run and execute receipt with synthetic data;
- legal-hold negative/positive proof;
- media/provider cleanup proof where enabled;
- backup-retention review and expiry behavior;
- monitoring/incident/rollback evidence;
- qualified privacy/legal review.

## Completion rule

Storytime may say an export is complete only when its Storytime-owned package and receipt exist with no unresolved export blockers.

Storytime may say deletion is complete only after destructive execution, post-delete verification, and backup-retention certification have all succeeded. A request, plan, mutation, or queue record by itself is never completion.
