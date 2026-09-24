# Privacy Operations Architecture

## Current State

Storytime privacy operations now have a real repository-owned execution path, but production certification remains blocked by exact-head CI, isolated Firebase runtime proof, URAI Privacy review, backup-retention certification, and provider/media cleanup evidence where applicable.

The canonical implementation is split between:

- `functions/src/privacy-requests.ts` — verified, explicit request creation and ownership checks.
- `functions/src/privacy-execution.ts` — private export packaging/retrieval and deletion plan/execute/verify lifecycle.
- `src/components/storytime/PrivacyRequestControls.tsx` — user-visible request, export-package, download, and deletion dry-run controls.
- `urai-privacy` — governing user-rights, retention, deletion, legal-hold, export, audit, and production-release authority.

## Export lifecycle

1. A verified user creates an explicit `export` privacy request.
2. `processStorytimeExportRequest` inventories Storytime-owned records for the approved scope.
3. The export is serialized to private Cloud Storage with `private, max-age=0, no-store`.
4. A manifest records schema/policy version, record counts, blockers, and SHA-256 integrity.
5. A privacy completion receipt records packaging evidence.
6. `getStorytimeExportDownloadUrl` returns an owner-only signed URL with a 15-minute TTL.
7. If family/child or external-provider dependencies are detected, the package is marked `partial_review_required` and the privacy request remains processing rather than falsely complete.

The Storytime export is not represented as the whole-URAI account export. Cross-system/family/provider data remains under URAI Privacy authority.

## Deletion lifecycle

Deletion follows the URAI Privacy pattern:

1. Verified user creates an explicit `deletion` privacy request.
2. `planStorytimeDeletion` inventories current Storytime-owned targets and writes an immutable plan record.
3. The plan receives a SHA-256 plan hash.
4. Legal hold is checked.
5. Account-scope deletion fails closed if family/child membership requires URAI Privacy review.
6. Account-scope deletion fails closed unless `STORYTIME_FIREBASE_ISOLATED=true`.
7. Provider/media references block destructive execution until their deletion path is proven.
8. Destructive execution is admin-only and requires the exact current plan hash plus `DELETE_STORYTIME_DATA`.
9. The server rebuilds the plan immediately before mutation; changed targets invalidate the approval.
10. Primary-store deletion and account-auth deletion are executed only when the plan is blocker-free.
11. A mutation receipt is retained.
12. `verifyStorytimeDeletion` re-inventories the subject and confirms that primary targets/auth are gone.
13. Final `completed` status remains blocked until `STORYTIME_BACKUP_RETENTION_POLICY_READY=true`.
14. A final completion receipt is created only after verification and backup-retention certification.

## Server-only evidence

The following are server-owned and denied to direct client access:

- `privacyDeletionPlans`
- `privacyCompletionReceipts`

`privacyRequests` are user-readable/admin-readable, server-created, and admin-updatable.

## Retained evidence

Privacy request history, deletion plans, completion receipts, and legal-hold records are retained as governance evidence unless URAI Privacy policy changes their retention class.

## Hard boundaries

- User UI cannot call destructive deletion execution.
- No destructive deletion occurs from a request alone.
- No account deletion occurs while Storytime Firebase isolation is unverified.
- No deletion executes while a legal hold is active.
- No deletion executes across unresolved family/child ownership boundaries.
- No provider/media artifact is claimed deleted merely because Storytime records were removed.
- No deletion is called complete until post-delete verification passes.
- No deletion is called complete while backup-expiry policy remains uncertified.
- No export is called complete for the whole URAI estate when Storytime can only prove its own data scope.

## Production blockers

Before Storytime privacy operations are production-ready:

- exact-head CI/functions build must pass;
- Firebase emulator authorization behavior must pass;
- isolated Storytime Firebase staging must be real and evidenced;
- controlled export readback must verify package integrity and signed-link scope;
- controlled deletion dry-run/execute/verification must prove owner/admin/cross-user behavior with synthetic data;
- backup retention/expiry policy must be reviewed and certified;
- family/child handling must be reviewed through URAI Privacy;
- provider/media deletion obligations must be resolved;
- live audit/monitoring/rollback evidence must exist;
- required privacy/legal/security approvals must be recorded.

No source implementation alone satisfies those runtime gates.
