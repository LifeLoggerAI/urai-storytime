# Privacy and safety engineering notes

Last reconciled: 2026-07-06

This is an engineering boundary document, not legal advice or a compliance certification.

## Launch posture

Until qualified review and technical receipts exist, Storytime must be presented as an adult/guardian-operated private storytelling internal alpha. Do not claim COPPA compliance, child-directed production readiness, therapy, diagnosis, biometric safety, or complete deletion/export rights.

## Data minimization

Collect only data needed for the confirmed story request. Names, schools, addresses, phone numbers, exact locations, health details, account credentials, and third-party private information should be discouraged and technically minimized. Future photo, voice, document, calendar, Life Map, relationship, or location inputs require separate purpose and consent controls.

## Consent model

Consent must be explicit, specific, versioned, revocable, and enforced server-side. Separate consent is required for:

- story generation;
- use of URAI memories or relationship/place data;
- voice recording or synthetic voice;
- photo/likeness and third-party subjects;
- public sharing;
- image, audio, video, or spatial generation;
- analytics beyond strictly necessary operations;
- provider processing where policy requires disclosure.

A client-supplied boolean is not sufficient by itself. The server must verify the consent version, account/guardian authority, purpose, and applicable policy.

## Child and family boundaries

Before enabling child-directed use:

- define adult account and guardian authority;
- define age bands and whether date of birth is necessary;
- implement family membership and role lifecycle;
- prevent children from creating public shares or changing consent;
- define consent for people represented in stories;
- define school/classroom as a separate product/tenancy decision;
- document retention and deletion for child-associated data;
- review applicable laws with qualified counsel.

The current UI age selector is not an effective safety control until the server validates and applies it.

## Generation safety

Required pipeline:

1. schema validation and size limits;
2. prompt-injection and unsafe-content precheck;
3. age/audience policy;
4. provider allow-list, timeout, retry, idempotency, and budget;
5. strict structured output validation;
6. unsafe-content and PII postcheck;
7. quarantine/manual review when required;
8. versioned safety receipt;
9. no public/media output until the safe story version is approved.

A small substring blocklist is a conservative demo signal, not production moderation.

## Public sharing

Public shares are separate minimized derivatives. They must:

- require owner consent at creation;
- pass PII/redaction and content review;
- use server timestamps and server/rules active-state enforcement;
- expire by default;
- be revocable immediately;
- avoid private asset URLs and source references;
- define search-engine and cache behavior;
- preserve a minimal audit receipt without retaining unnecessary public content.

Regex redaction cannot guarantee anonymity. Contextual identifiers and rare details require stronger detection and user review.

## Authentication and authorization

- Firebase identity proves an authenticated account, not guardian status or consent.
- All object access must be checked at server and rules layers.
- Admin/moderator roles must come from trusted claims and be reviewed.
- Authoritative audit events must be server-written and append-only where possible.
- App Check, rate limits, abuse detection, email verification, reset/recovery, and session controls are required for external launch.

## Uploads and media

Before any upload feature launches:

- allow-list file types and verify magic bytes;
- enforce per-file/user limits;
- scan for malware;
- remove or deliberately preserve metadata according to policy;
- store private by default;
- use signed expiring access;
- validate image/audio/video dimensions and duration;
- define copyright, likeness, voice, and third-party consent;
- include provider and derived-asset deletion in account deletion.

## Provider handling

For each provider record:

- contract/subprocessor and environment;
- approved data categories;
- retention and training-use setting;
- region where relevant;
- model/version;
- request ID, token/usage/cost receipt;
- purpose and consent snapshot;
- deletion capability;
- incident contact and fallback.

Never log authorization headers, private keys, provider raw errors containing content, prompts, story bodies, voice data, or signed URLs.

## Data rights and retention

Implement and test:

- user-visible data inventory;
- story and account export;
- individual story/session deletion;
- account deletion cascade;
- share revocation;
- provider/media deletion;
- retention schedule and automated expiry;
- backup retention and restore policy;
- minimal lawful/security audit tombstones;
- idempotent retry and completion receipt.

Rules that deny deletion are acceptable only as a temporary client boundary when a verified server deletion workflow exists. That workflow does not yet exist.

## Analytics

Allow-listed events may contain IDs, coarse status, duration buckets, error codes, and consented product events. Do not send raw prompts, story text, names, child profiles, relationship details, exact locations, voice/photo data, or provider outputs to analytics.

## Logging and observability

Structured operational logs should use request/job/session IDs and classified error codes. Access to moderation content must be separate, least-privilege, audited, and time-limited. Add automated log-scrubbing tests.

## Legal review questions

Qualified counsel should review at least:

- whether the service is child-directed and applicable COPPA/state/international duties;
- parental consent/verification and family-member data;
- voice/likeness/biometric treatment;
- copyright, derivative works, provider output ownership, and physical-book rights;
- sensitive memory, grief, and therapeutic-adjacent positioning;
- public-sharing consent and removal;
- privacy notice, terms, retention, deletion, subprocessors, and international transfers;
- classroom/educator and creator modes.

## Minimum evidence before external beta

- approved product launch posture and policy version;
- executable authorization/emulator receipt;
- generation pre/post safety receipt;
- data export/delete receipt;
- public share create/read/revoke/expire receipt;
- provider data/cost receipt with synthetic input;
- accessibility and abuse-reporting path;
- incident, backup, and rollback owners;
- legal/privacy/child-safety approval appropriate to enabled features.
