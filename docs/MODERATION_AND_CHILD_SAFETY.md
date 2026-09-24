# URAI Storytime Moderation And Child Safety

## Status

Storytime has a **source-level fail-closed moderation foundation**. It is not production moderation certification and it does not establish child-directed production readiness.

Current source includes:

- input safety pattern checks before provider generation;
- output safety checks before generated content can be persisted/displayed as ready;
- reason-coded moderation cases;
- SHA-256 content fingerprints;
- moderation queue records that intentionally contain no raw story body;
- server-owned Admin moderation state transitions;
- immutable server-owned moderation action receipts;
- no approval/release action from the sanitized moderation queue.

Provider moderation, secure human content review, guardian reporting/escalation, live operational staffing, incident handling, and legal/privacy/child-safety approval remain open.

## Launch posture

Storytime remains adult/guardian-operated.

Audience age bands influence requested story policy but do not create child accounts, establish verified parental authority, or certify compliance with child-directed service requirements.

No child/family production claim may rely on source code alone.

## Moderation pipeline

### Layer 1 — Request validation and input safety

Before generation, Storytime:

- validates bounded request schema;
- requires verified adult/guardian account state;
- requires explicit generation/provider-processing consent;
- applies canonical audience bands;
- checks reason-coded safety/prompt-injection patterns;
- blocks flagged input before provider execution;
- creates a moderation case containing reason codes and a content fingerprint, not raw story content.

Current local pattern checks are conservative engineering safeguards, not a substitute for an approved production moderation policy/provider.

### Layer 2 — Provider and structured output boundary

Provider execution remains gated by readiness, consent, quota, idempotency, bounded timeout, and current locale/audience policy.

Provider output is parsed into bounded structured fields.

Raw provider error bodies must not be surfaced to users or broad logs.

### Layer 3 — Output safety

Before Storytime output becomes a ready saved story:

- generated fields are reassembled into a safety-check input;
- reason-coded output checks run;
- flagged output is not persisted/displayed as a ready story;
- the generation request moves to `needs_review`;
- a sanitized moderation case is created.

This is a quarantine boundary, not a human-review completion claim.

## Moderation case model

Current moderation cases use:

- schema version `storytime-moderation-review-v1`;
- request id;
- stage: `input` or `output`;
- status;
- reason codes;
- SHA-256 content fingerprint;
- `containsRawStoryContent: false`;
- created/updated timestamps.

The queue intentionally does not expose raw story text.

## Admin operations

Current server-owned Admin operations are:

- `listStorytimeModerationCases`;
- `getStorytimeModerationCase`;
- `transitionStorytimeModerationCase`.

Trusted Admin authority is required.

Allowed operational transitions are deliberately limited to:

- `escalate` → `escalated`;
- `close_blocked` → `resolved_blocked`.

There is **no approve/release action** in this contract.

A sanitized fingerprint/reason-code record is insufficient evidence to approve content. Approval/release must remain impossible until a separately governed secure content-review channel exists.

## Admin audit evidence

Each moderation transition writes a server-owned receipt using:

`storytime-moderation-audit-v1`

The receipt records:

- moderation case id;
- trusted actor uid;
- action;
- reason code;
- prior status;
- next status;
- content fingerprint;
- `containsRawStoryContent: false`;
- server timestamp.

Firestore clients, including Admin UI clients, cannot directly write moderation cases or moderation audit receipts. State mutation occurs through trusted Functions.

## Secure human review — required before approval can exist

A future secure review system must define and prove:

- how a reviewer obtains minimum-necessary content;
- separate least-privilege authorization for sensitive review;
- review-session expiry;
- no broad persistence of raw content in queue/index/log systems;
- reviewer access logs;
- reason/policy version;
- reviewer training/role requirements;
- escalation for severe content;
- retention/deletion of review material;
- appeal/reconsideration policy where applicable;
- guardian-facing reporting path where applicable;
- exact conditions under which content may return to an approved state.

Until that exists, flagged Storytime content stays blocked.

## Guardian and user reporting

Still required before family-facing production claims:

- user/guardian report control;
- report categories and abuse prevention;
- report acknowledgement/status;
- emergency/severe-risk escalation policy;
- governed support channel;
- deletion/privacy integration;
- auditable operator actions;
- clear boundary that Storytime is not emergency or clinical care.

Do not invent emergency monitoring or response capabilities.

## Child-data handling

Storytime must not silently treat child/family data as ordinary content.

Current safe posture:

- adult/guardian-operated;
- private by default;
- no child self-service account claim;
- no public child profile;
- no precise child location/school collection requirement;
- no voice/photo/likeness ingestion activation;
- no memory/relationship ingestion without separate future consent authority;
- public sharing separately consented and minimized;
- non-English locales hard-off pending review.

Direct child accounts, classroom use, family collaboration, personalized/cloned family voice, and likeness-based illustration remain separate future product/policy decisions.

## Firestore boundary

Current source requires:

- `moderation`: Admin read only; client writes denied;
- `moderationAuditLogs`: Admin read only; client create/update/delete denied.

Generation Functions use trusted Admin SDK writes to create moderation cases.

Admin moderation Functions use trusted server writes for transitions/receipts.

## Required tests before production moderation claims

Source-contract tests are not runtime proof.

Still required:

- emulator authorization tests for non-admin/admin reads and denied direct writes;
- callable tests for unauthenticated/non-admin denial;
- transition state-machine tests;
- repeated/idempotent escalation tests;
- terminal-state rejection;
- raw-content rejection;
- audit-receipt creation/readback;
- synthetic unsafe input/output lifecycle;
- secure-review channel tests once that channel exists;
- guardian/user report lifecycle tests once reporting exists;
- staging operator audit;
- monitoring/alert evidence;
- retention/deletion tests.

## Production blockers

Storytime moderation/child-safety remains **NO-GO for family/child production claims** until:

- approved safety policy and policy version exist;
- provider moderation/data treatment is reviewed where a provider is enabled;
- secure human review exists for any workflow that can approve/release flagged content;
- user/guardian reporting and escalation are implemented for the enabled launch posture;
- moderator/Admin access is least-privilege and operationally reviewed;
- runtime authorization and audit evidence pass;
- child/family privacy and legal review is complete for the exact enabled feature set.

## Truth boundary

A moderation case is evidence that content was blocked or flagged.

An escalation is not an approval.

A resolved-blocked case is not a safe-content certification.

No code path may turn a sanitized moderation case into released user content until the secure review and approval contract exists and is separately proven.
