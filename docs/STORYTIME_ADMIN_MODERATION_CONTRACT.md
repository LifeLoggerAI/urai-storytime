# Storytime ↔ URAI Admin Moderation Authority

## Current model

Storytime now has two distinct, compatible moderation layers:

1. **Storytime server operations** own the local sanitized moderation queue, admin-only listing/inspection, fail-closed transitions, and immutable audit records.
2. **URAI Admin integration contract** defines the future cross-repository control-plane handoff.

Neither layer permits release of flagged content from the current evidence model.

## Why release is prohibited

Storytime moderation records intentionally contain:
- reason codes;
- content SHA-256 fingerprint;
- stage/status metadata;
- no raw story content.

That evidence is sufficient to quarantine, escalate, or close a case as blocked. It is **not** sufficient for a human reviewer to approve the underlying story.

Therefore the only current moderation decisions are:
- `escalate`
- `close_blocked`

Every response carries:
- `releaseAuthorized: false`
- `secureContentReviewAvailable: false`

## Cross-repo handoff

`storytime-admin-moderation-v1` can carry a future review request from Storytime to URAI Admin using:
- moderation identity;
- request identity;
- reason codes;
- content fingerprint;
- hashed user/session references;
- provenance and consent version;
- no raw story content.

A returned Admin receipt must include:
- governed reviewer principal/role;
- separation-of-duties result;
- decision identity;
- evidence receipt ID;
- audit event ID;
- policy version;
- no raw story content;
- no release authority.

The integration defaults to `hard_off`.

## Activation gates

Do not activate cross-repo moderation dispatch until:
- URAI Admin exact interface is reviewed;
- least-privilege moderator identities are deployed;
- access/session expiry and audit logging are proven;
- sensitive-content retention is approved;
- synthetic staging dispatch/decision/replay tests pass;
- unauthorized reviewer denial is proven;
- incident/escalation ownership is assigned;
- exact-head Storytime and Admin evidence is retained.

## Future secure review

If Storytime ever supports approve/release of flagged content, that capability requires a separately governed minimum-necessary secure content-review channel. It must not be inferred from the fingerprint-only queue.

## Truth boundary

Current source implements fail-closed Storytime moderation operations and a hard-off cross-repo contract.

It does not establish:
- a live urai-admin moderation screen;
- raw-content review;
- release of flagged content;
- an approved legal/child-safety moderation policy;
- production escalation/incident certification.
