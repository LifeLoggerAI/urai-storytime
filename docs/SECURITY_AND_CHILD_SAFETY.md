# URAI Storytime Security and Child Safety Plan

## Purpose

URAI Storytime is a private narrative-memory system intended to support family-safe storytelling while remaining adult/guardian-operated at the current launch boundary.

This document defines engineering safeguards and unresolved requirements. It is not legal advice, does not certify COPPA or other child-directed compliance, and does not authorize direct child accounts.

## Current source baseline

The canonical product is the Next.js/Firebase Storytime application.

Current source includes:

- Firebase email/password authentication, email verification, and password recovery;
- verified-account gating for cloud generation and new public-share creation;
- private Storytime sessions with owner-scoped Firestore access;
- explicit adult/guardian operator affirmation;
- explicit versioned story-generation and provider-processing consent;
- server-enforced audience age bands;
- generation quotas and request idempotency;
- input and output safety checks;
- sanitized moderation records with reason codes and content fingerprints;
- server-owned fail-closed moderation Admin transitions;
- generic minimized public-safe share records with server expiry/revocation;
- Storytime-owned export/deletion request and execution foundations;
- hard-off provider/media/future-system contracts;
- source-level accessibility safeguards.

This baseline is **not production certification**. Isolated Firebase staging, executable authorization, provider/runtime, moderation operations, accessibility runtime, legal/privacy/child-safety and deployment/rollback evidence remain incomplete.

## Current launch posture

Storytime is adult/guardian-operated.

Audience bands shape story policy. They do not:

- create a child profile;
- prove parental identity;
- authorize child self-service;
- establish a date-of-birth/age-assurance system;
- authorize public sharing by a child;
- establish legal compliance.

Direct child accounts and classroom/creator modes remain separate future decisions.

## Safety principles

- Safe before magical.
- Adult/guardian operated.
- Private by default.
- Minimal data collection.
- No hidden camera, microphone, location, or passive child-data collection.
- No public child profile.
- No public/private boundary change without explicit consent.
- No personalized/cloned voice merely because source audio exists elsewhere.
- No family likeness use without separate authority.
- No sensitive memory ingestion without purpose-specific consent and provenance.
- No unsafe output displayed/saved/shareable as ready content.
- Human review must be least-privilege and auditable.
- Qualified legal/privacy review is required for child/family production claims.

## Input safety

Every cloud generation request must pass:

1. authenticated verified adult/guardian account boundary;
2. bounded schema validation;
3. explicit consent/version validation;
4. canonical audience band;
5. unsafe-content and prompt-injection checks;
6. quota/idempotency boundary;
7. configured-provider readiness.

Flagged input is blocked before generation and creates a sanitized moderation case.

## Output safety

Provider output is structurally validated and safety-checked before it can become a ready persisted story.

Flagged output:

- is not presented as ready content;
- causes the generation request to enter review state;
- creates a sanitized moderation case;
- cannot be public-shared;
- has no approval/release path from the current sanitized Admin queue.

## Moderation and human review

The moderation queue contains:

- reason codes;
- input/output stage;
- content fingerprint;
- timestamps/state;
- no raw story content.

Admin can inspect sanitized metadata, escalate, or close-as-blocked through trusted server Functions.

Direct client/Admin Firestore mutation is denied.

There is no approval/release operation until a secure minimum-necessary content-review channel is separately implemented and proven.

See `docs/MODERATION_AND_CHILD_SAFETY.md`.

## Public sharing

Public sharing remains separately gated.

Current public documents are generic/minimized derivatives and exclude owner/session/source identifiers.

Requirements include:

- verified owner;
- explicit public-sharing consent;
- safety-approved private source session;
- server Timestamp expiry;
- immediate owner revocation;
- server-owned control records;
- public records that do not carry private source identifiers.

Public sharing may remain disabled by environment/policy even when source implementation exists.

## Child/family data boundaries

Avoid collecting unless separately approved and necessary:

- precise child location;
- school name;
- full legal identity;
- sensitive health information;
- private family conflict details;
- child voice, image, biometric/likeness material.

Future family collaboration must define:

- invitation/role lifecycle;
- guardian authority;
- subject consent;
- revoke access;
- data export/deletion ownership;
- third-party family-member data handling.

Storytime account deletion fails closed when family/child shared authority requires URAI Privacy review.

## Voice, image and media

Voiceover/media execution is currently hard-off.

Before activation require:

- explicit voice/media consent;
- voice/likeness ownership and subject authority;
- approved provider and retention/training treatment;
- hard cost ceilings;
- private storage;
- provenance;
- captions/transcripts and accessible controls;
- cancellation/retry/failure recovery;
- provider/media deletion lifecycle.

## Authentication and authorization

External launch requires executable proof that:

- signed-out users cannot access private Storytime records;
- owners can access only intended records;
- non-owners are denied by direct id and query;
- family/admin claims follow the approved role model;
- moderation/receipt/counter/deletion-plan collections are server-owned;
- Storage ownership/claims behave as designed;
- public-share active/revoked/expired behavior is enforced.

Static rules inspection is not enough.

## Abuse prevention

Source has generation quotas and selected safety/prompt-injection checks.

Still required for external launch where applicable:

- App Check or equivalent abuse boundary;
- suspicious/repeated request monitoring;
- rate limits beyond current generation quotas;
- operational alerts;
- provider/cost anomaly detection;
- user/guardian reporting;
- incident/escalation ownership.

## Data rights

Storytime has source-level export/deletion execution foundations, but production completion requires runtime proof.

Account deletion remains blocked unless:

- Firebase Storytime isolation is certified;
- legal hold is clear;
- family/child shared authority is resolved;
- external provider/media cleanup is certified;
- current plan hash matches at destructive execution;
- post-delete verification passes;
- backup retention/expiry policy is certified.

A deletion request or primary-store mutation is not automatically a completed deletion.

## Accessibility and neurodivergence

Storytime source includes reduced-motion behavior, keyboard-focus visibility, semantic status/error regions, responsive layout, forced-colors support, and form semantics.

Still required:

- keyboard-only runtime journey;
- screen-reader testing;
- zoom/reflow;
- mobile/tablet QA;
- high-contrast/forced-colors runtime verification;
- reduced-motion runtime verification;
- automated rendered-page accessibility testing;
- performance receipts.

Do not claim complete audio/narration accessibility while media execution is hard-off.

## Globalization

Twenty governed launch languages are registered as capability authority, but only English is enabled in Storytime.

The other locales remain hard-off pending native language, safety, accessibility, RTL where applicable, narration and regional/legal review.

Machine-generatable text is not equivalent to supported locale certification.

## Production blockers

Do not launch Storytime as a child/family production product until the exact enabled feature set has:

- isolated Storytime Firebase staging/production identity;
- exact-head green CI and independent review;
- executable Auth/Firestore/Storage authorization evidence;
- provider data/cost/safety proof for any enabled provider;
- secure moderation operations appropriate to enabled claims;
- user/guardian reporting path where required;
- complete data-rights runtime evidence;
- accessibility/browser/mobile/performance evidence;
- monitoring, backup, incident and rollback evidence;
- legal/privacy/child-safety review;
- exact deployment/DNS/TLS/live readback receipts.

## Truth boundary

Current source is substantially beyond the historical static demo.

It is also not yet a production-certified family/child system.

All public and internal status language must preserve both facts.
