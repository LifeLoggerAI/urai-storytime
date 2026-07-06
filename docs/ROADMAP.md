# URAI Storytime canonical roadmap

Last reconciled: 2026-07-06  
Evidence baseline: `main@af3b97166b23c55618ae3cdd91a96bb035fd40f2`  
Companion audit: `docs/AUDIT_2026-07-06.md`

This document supersedes the older phase plan that described the repository as a static demo awaiting Next.js and Firebase. The current repository already contains a Next.js/Firebase internal-alpha foundation. Roadmap status must be proven by code, tests, CI, and environment receipts—not by intent.

## Product boundary

V1 is a private, adult/guardian-operated story creation and reading product with a deterministic demo, authenticated private cloud sessions, age-aware safety, explicit consent, redacted/revocable sharing, and honest provider/media gates. Advanced family graphs, collaboration, rich media, and spatial experiences follow only after V1 trust controls are complete.

Complexity uses XS/S/M/L/XL. No calendar estimates are asserted.

# P0 — Critical truth and launch blockers

## P0.1 Reproducible current-head CI

- **User value:** users receive a build whose exact source and checks are known.
- **Current evidence:** historical PR run `26130875564` passed app and Functions jobs; audited `main` has no attached run/status. Root and Functions lockfiles are absent.
- **Problem:** current code cannot be promoted from historical CI evidence, and `npm install` is nondeterministic.
- **Scope:** commit lockfiles; standardize Node/npm versions; switch CI to `npm ci`; run app, Functions, validators, dependency audit, and artifact receipt on every PR/main SHA.
- **Repository areas:** `package*.json`, `functions/package*.json`, `.github/workflows/**`.
- **Dependencies:** none.
- **Risks:** dependency resolution may reveal latent build/test failures.
- **Privacy/safety impact:** indirect but launch-blocking; prevents unreviewed dependency drift.
- **Cost impact:** GitHub Actions minutes only.
- **Tests required:** install, lint, typecheck, unit/static smoke, Functions build, production build.
- **Acceptance criteria:** one green workflow and downloadable receipt tied to the exact candidate SHA.
- **Definition of done:** required checks are branch-protected and repeatable from a clean checkout.
- **Complexity:** M.
- **Blocks launch:** yes.

## P0.2 Isolated Firebase environments and deployment truth

- **User value:** private Storytime data is not mixed with unrelated URAI systems and can be safely promoted/rolled back.
- **Current evidence:** `.firebaserc` contains `REPLACE_WITH_URAI_STORYTIME_STAGING`; no deployed or rollback SHA is recorded.
- **Problem:** staging/production identity, hosting target, DNS, and rollback are unproven.
- **Scope:** provision isolated staging/production projects; configure aliases/targets; document non-secret IDs; deploy staging; record SHA, URL, rules/functions/hosting versions; perform production promotion and rollback rehearsal only after gates pass.
- **Repository areas:** `.firebaserc`, `firebase.json`, deployment/evidence docs.
- **Dependencies:** owner credentials, Firebase billing where required, DNS access.
- **Risks:** wrong-project deploy, data mixing, irreversible public claims.
- **Privacy/safety impact:** critical isolation boundary.
- **Cost impact:** Firebase usage/billing requires explicit approval.
- **Tests required:** config validator, project isolation assertion, staging smoke, rollback smoke.
- **Acceptance criteria:** staging and production receipts name exact projects, URLs, SHAs, timestamps, and rollback SHA.
- **Definition of done:** production can be independently deployed and rolled back without touching Core/Analytics.
- **Complexity:** L.
- **Blocks launch:** yes.

## P0.3 Executable Auth/Firestore/Storage authorization proof

- **User value:** one family cannot read or alter another family’s stories, voices, media, or settings.
- **Current evidence:** rules and behavior spec exist; no current emulator execution receipt.
- **Problem:** static regex validation does not prove authorization behavior.
- **Scope:** implement emulator tests for signed-out, owner, non-owner, guardian, viewer, admin, revoked share, expired share, usage counters, Storage claims, and malicious field mutation.
- **Repository areas:** `firestore.rules`, `storage.rules`, `tests/emulator/**`, `firebase.json`.
- **Dependencies:** stable data model and Firebase emulator.
- **Risks:** rules may require redesign when tests exercise queries.
- **Privacy/safety impact:** critical.
- **Cost impact:** none locally/CI.
- **Tests required:** positive and negative rule tests, query compatibility, mutation immutability.
- **Acceptance criteria:** emulator suite fails on every unauthorized scenario and passes intended owner/public-safe scenarios.
- **Definition of done:** CI publishes rule-test receipt for exact release SHA.
- **Complexity:** L.
- **Blocks launch:** yes.

## P0.4 Adult/guardian, age-band, and explicit generation consent enforcement

- **User value:** generated content follows the intended audience policy and uses personal material only with informed permission.
- **Current evidence:** UI collects `ageRange`; server schema/prompt ignore it. Client submits `storyGeneration: true` automatically.
- **Problem:** child/family positioning is not backed by server-enforced age/guardian/consent controls.
- **Scope:** define adult account and guardian model; add explicit consent UI; add server schema for age band, source type, subjects, and consent version; reject unsupported child-directed use; persist policy snapshot; incorporate age policy in pre/post moderation.
- **Repository areas:** `StorytimeHome.tsx`, domain types, Functions schemas/provider prompt, Firestore rules.
- **Dependencies:** product/privacy/legal decisions.
- **Risks:** incorrect age/legal assumptions.
- **Privacy/safety impact:** critical.
- **Cost impact:** moderation/provider calls may add cost; budget separately.
- **Tests required:** missing/false consent, invalid age, policy-version, guardian ownership, provider prompt assertions.
- **Acceptance criteria:** server—not UI—enforces the effective policy and records the exact consent/policy snapshot.
- **Definition of done:** counsel-reviewed policy is implemented and emulator/live tests pass.
- **Complexity:** XL.
- **Blocks launch:** yes for child/family marketing; adult-only private alpha can remain gated.

## P0.5 Production-safe generation orchestration

- **User value:** story requests complete reliably, cannot double-charge, and fail without losing or exposing private content.
- **Current evidence:** direct OpenAI call, quota counters, JSON parsing, no timeout/retry/idempotency/output moderation/job state.
- **Problem:** synchronous provider call is not operationally safe or auditable.
- **Scope:** durable job record; idempotency key; abort timeout; bounded retries with backoff; structured Zod output schema; input/output moderation; PII scan; model/version/token/cost receipt; cancellation; partial failure state; safe error mapping.
- **Repository areas:** `functions/src/story-provider.ts`, `functions/src/storytime.ts`, new job/provider modules and tests.
- **Dependencies:** provider access and approved safety policy.
- **Risks:** cost amplification, duplicate writes, unsafe output.
- **Privacy/safety impact:** critical.
- **Cost impact:** hard per-job and daily budgets required before enablement.
- **Tests required:** timeout, malformed JSON, unsafe output, duplicate request, retry exhaustion, quota race, atomic persistence.
- **Acceptance criteria:** no provider call occurs without consent, entitlement, idempotency, and budget gates; every call has a receipt.
- **Definition of done:** controlled staging smoke generates and reads back a safe story with provider and cost receipts.
- **Complexity:** XL.
- **Blocks launch:** yes for cloud AI; deterministic demo does not require it.

## P0.6 Public-share server boundary

- **User value:** a revoked or expired share becomes unreadable and private story records never leak.
- **Current evidence:** create/revoke callables exist; audit branch aligns reader query with `revoked == false`; expiry is client-only ISO-string logic.
- **Problem:** rules do not enforce expiration and redaction is heuristic.
- **Scope:** store server timestamp expiry; rules or server endpoint enforce active state; improve PII/redaction pipeline; make share creation idempotent; define cache/robots policy; test create/read/revoke/expire.
- **Repository areas:** Functions share modules, `ShareStory.tsx`, rules/indexes, types/tests.
- **Dependencies:** migration plan for existing share records.
- **Risks:** public leakage, cached content after revoke.
- **Privacy/safety impact:** critical.
- **Cost impact:** low.
- **Tests required:** anonymous active read, revoked/expired denial, owner revoke, cross-owner denial, crawler headers.
- **Acceptance criteria:** expired/revoked records cannot be read through supported client queries or direct document lookup.
- **Definition of done:** emulator and deployed staging receipts prove the lifecycle.
- **Complexity:** L.
- **Blocks launch:** yes if sharing enabled; otherwise keep feature flag false.

## P0.7 Data rights and deletion

- **User value:** users can see, export, revoke, and delete their private information.
- **Current evidence:** no active account/story export/delete flows; multiple rules deny delete.
- **Problem:** privacy promises are incomplete and data can become effectively undeletable.
- **Scope:** inventory data; retention classes; account export; story/session delete; account deletion orchestration; media/provider deletion; share revocation; tombstones/audit strategy; backup retention disclosure.
- **Repository areas:** Functions, rules, settings UI, `urai-privacy` contract, operations docs.
- **Dependencies:** privacy/legal policy and cross-repo contracts.
- **Risks:** partial deletion, orphaned assets, destroyed audit evidence.
- **Privacy/safety impact:** critical.
- **Cost impact:** storage/egress may apply.
- **Tests required:** owner request, non-owner denial, complete cascade, retry/idempotency, export integrity.
- **Acceptance criteria:** automated inventory confirms no user-owned active record remains after deletion except approved minimal audit tombstones.
- **Definition of done:** staging export/delete receipts and reviewed retention policy.
- **Complexity:** XL.
- **Blocks launch:** yes.

# P1 — Production-complete core

## P1.1 Guided story builder and draft workflow

- **User value:** people can create a story without understanding internal terms.
- **Current evidence:** one form for title/theme/age/mood/source.
- **Scope:** multi-step wizard for audience, people/pets/places, genre, tone, length, language, source permissions, review; autosaved draft; validation and recovery.
- **Areas:** Storytime components, domain schemas, Firestore drafts.
- **Dependencies:** P0 policy/data model.
- **Risks:** collecting excessive personal data.
- **Privacy/safety:** minimize fields; clear optionality and consent.
- **Cost:** no provider call until final confirmed step.
- **Tests:** form state, resume, validation, consent, mobile/keyboard.
- **Acceptance/DoD:** a first-time user creates and resumes a draft, reviews exactly what will be sent, then intentionally generates.
- **Complexity:** L.
- **Blocks launch:** yes for polished V1.

## P1.2 Story reader, editor, regeneration, and version history

- **User value:** users can read, correct, and selectively improve stories without regenerating everything.
- **Current evidence:** static chapter cards and narrator text.
- **Scope:** scene/chapter reader, edit, regenerate section, compare versions, restore, progress, loading/error/retry, content report.
- **Areas:** `StoryPlayer`, story version model, Functions.
- **Dependencies:** P0 generation jobs.
- **Risks:** version confusion and repeated provider spend.
- **Privacy/safety:** preserve moderation status per version.
- **Cost:** show/confirm estimated regeneration cost; hard cap.
- **Tests:** optimistic concurrency, version restore, section regeneration, moderation regression.
- **Acceptance/DoD:** edits and generations create immutable versions with provenance and no silent overwrite.
- **Complexity:** XL.
- **Blocks launch:** yes for full V1; read-only beta could precede it.

## P1.3 Account lifecycle and support

- **User value:** reliable sign-in, recovery, verification, help, feedback, and abuse reporting.
- **Current evidence:** basic email/password create/sign-in/sign-out only.
- **Scope:** email verification, password reset, recovery messaging, session/device management, account deletion entry, support/report forms, rate limiting/App Check.
- **Areas:** `AuthPanel`, Firebase Auth, Functions, support integration.
- **Dependencies:** P0 data rights and policy.
- **Risks:** account takeover and abuse.
- **Privacy/safety:** avoid exposing account existence; protect reports.
- **Cost:** low/provider email costs.
- **Tests:** verification/reset/error mapping/rate abuse.
- **Acceptance/DoD:** complete live lifecycle receipt with no raw provider errors shown.
- **Complexity:** L.
- **Blocks launch:** yes.

## P1.4 Real moderation and administrative operations

- **User value:** unsafe requests and outputs are handled consistently, with accountable human review when required.
- **Current evidence:** substring blocklist, console audit events, rules/docs scaffolding.
- **Scope:** policy engine, moderation provider adapter, review states, admin queue in `urai-admin`, server-only audit log, reason codes, appeals/reporting.
- **Areas:** Functions safety modules, admin contract, Firestore rules.
- **Dependencies:** approved safety policy and role provisioning.
- **Risks:** reviewer exposure to sensitive content; privilege abuse.
- **Privacy/safety:** least privilege, redaction, access logs, retention limits.
- **Cost:** moderation API and staff time.
- **Tests:** policy fixtures, role checks, audit immutability, unsafe output quarantine.
- **Acceptance/DoD:** blocked/reviewed content cannot become shareable; every admin action is attributable.
- **Complexity:** XL.
- **Blocks launch:** yes for child/family external use.

## P1.5 Narration, captions, and accessible playback

- **User value:** stories can be listened to and used by people with visual, reading, motor, or attention needs.
- **Current evidence:** narrator text only; queue scaffold.
- **Scope:** browser speech fallback, provider TTS behind consent/cost gate, audio player, captions/transcript, playback speed, scene timing, keyboard controls, reduced motion.
- **Areas:** player/narrator components, media job system, Storage.
- **Dependencies:** P0 job/data controls.
- **Risks:** voice consent and provider retention.
- **Privacy/safety:** explicit voice/provider consent and deletion.
- **Cost:** per-character TTS budget.
- **Tests:** browser support, captions sync, keyboard/screen reader, failed audio fallback.
- **Acceptance/DoD:** complete accessible story playback with downloadable receipt for generated audio ownership.
- **Complexity:** L.
- **Blocks launch:** no for text V1; yes for narration claims.

## P1.6 Browser, mobile, accessibility, security, and performance certification

- **User value:** stable, understandable product across common devices and assistive technology.
- **Current evidence:** source smoke only; no real browser E2E/a11y/performance receipt.
- **Scope:** Playwright journeys, axe checks, mobile/tablet viewports, cross-browser, reduced motion, Lighthouse budgets, dependency/code scanning, upload limits when introduced.
- **Areas:** tests/workflows/CSS/components.
- **Dependencies:** stable V1 journeys.
- **Risks:** late UX regressions.
- **Privacy/safety:** test fixtures must be synthetic.
- **Cost:** CI minutes/device service if used.
- **Tests:** named above.
- **Acceptance/DoD:** documented pass/fail matrix tied to release SHA, with no critical accessibility/security defects.
- **Complexity:** L.
- **Blocks launch:** yes.

## P1.7 Operational monitoring, backup, incident, and rollback

- **User value:** failures are detected, data is recoverable, and bad releases can be reversed.
- **Current evidence:** JSON console events and runbooks; no live monitoring/backup/rollback receipt.
- **Scope:** error tracking, metrics/SLOs, alerts, cost anomaly alerts, backup schedule, restore drill, incident runbook, status communication, release/rollback automation.
- **Areas:** Functions, hosting, workflows, ops docs.
- **Dependencies:** deployed environments.
- **Risks:** sensitive log leakage.
- **Privacy/safety:** logs exclude raw stories and secrets.
- **Cost:** monitoring/storage spend with explicit caps.
- **Tests:** alert test, restore drill, rollback smoke.
- **Acceptance/DoD:** on-call owner and tested receipts exist for alert, restore, and rollback.
- **Complexity:** L.
- **Blocks launch:** yes.

# P2 — Product expansion

## P2.1 Format and template system

- **User value:** bedtime, adventure, educational, family-history, pet, travel, celebration, remembrance, poem, and chapter formats share one safe engine.
- **Current evidence:** generic reflective one-chapter output.
- **Scope:** versioned format schemas, guided templates, length/reading-level/language parameters, format-specific validators and policy.
- **Areas:** domain models, provider prompts, UI templates.
- **Dependencies:** P0/P1 engine and moderation.
- **Risks:** unsafe template assumptions and prompt sprawl.
- **Privacy/safety:** each template declares allowed inputs and audience policy.
- **Cost:** token budgets by format.
- **Tests:** golden fixtures, reading-level checks, multilingual safety.
- **Acceptance/DoD:** every released format has schema, policy, tests, cost ceiling, and UX.
- **Complexity:** XL.
- **Blocks launch:** no.

## P2.2 Export platform and physical-book-ready artifacts

- **User value:** users can keep, print, and privately share their stories.
- **Current evidence:** queued export records and Asset-Factory adapter.
- **Scope:** PDF, EPUB, audio, image package, print-ready PDF; signed expiring downloads; job progress/cancel/retry; provenance manifest.
- **Areas:** Asset Factory contract, jobs, Storage, export UI.
- **Dependencies:** P0 data rights/jobs and media ownership policy.
- **Risks:** provider cost, copyright, public link leakage.
- **Privacy/safety:** private bucket, signed URLs, deletion cascade.
- **Cost:** explicit per-output gate and budget.
- **Tests:** schema contract, failed job, signed URL expiry, artifact validation.
- **Acceptance/DoD:** generated artifact matches story version and has provider/cost/ownership receipt.
- **Complexity:** XL.
- **Blocks launch:** no.

## P2.3 Collaboration and private family sharing

- **User value:** invited family members can contribute without making content public.
- **Current evidence:** family rules scaffolding only.
- **Scope:** invitations, roles, subject consent, contribution requests, approvals, comments, revoke access.
- **Areas:** family model/rules/UI/notifications.
- **Dependencies:** guardian and authorization model.
- **Risks:** coercion, accidental disclosure, stale access.
- **Privacy/safety:** granular roles and subject-level consent.
- **Cost:** low.
- **Tests:** invite/revoke/role matrix/cross-family denial.
- **Acceptance/DoD:** every participant can see why they have access and owner can revoke immediately.
- **Complexity:** XL.
- **Blocks launch:** no.

## P2.4 Multilingual production quality

- **User value:** families can create and consume stories in their preferred language.
- **Current evidence:** no language selector or quality evaluation.
- **Scope:** locale model, translated UI, provider locale control, narration voices, safety evaluation, fallback, RTL.
- **Areas:** i18n, prompts, TTS, tests.
- **Dependencies:** format engine and safety evaluation.
- **Risks:** uneven moderation and cultural harm.
- **Privacy/safety:** language-specific policy tests and review.
- **Cost:** provider/TTS evaluation budget.
- **Tests:** locale E2E, RTL, safety corpus, voice availability.
- **Acceptance/DoD:** each enabled language has reviewed UI, generation, moderation, and narration evidence.
- **Complexity:** XL.
- **Blocks launch:** no.

# P3 — Advanced platform

## P3.1 Persistent characters, series continuity, and branching narratives

- **User value:** recurring characters and worlds remain consistent across episodes and choices.
- **Current evidence:** no continuity or branch graph.
- **Scope:** character bible, world state, branch graph, canon/version rules, recap/context budget, continuity validator.
- **Dependencies:** versioned story engine.
- **Risks:** private identity persistence and escalating context cost.
- **Privacy/safety:** user-visible editable memory and deletion.
- **Cost:** context/token budget controls.
- **Tests:** continuity fixtures, branch replay, deletion propagation.
- **Acceptance/DoD:** canonical state is inspectable, editable, versioned, and reproducible.
- **Complexity:** XL.
- **Blocks launch:** no.

## P3.2 Creator/classroom tooling

- **User value:** educators and approved creators can build reusable safe templates.
- **Current evidence:** docs/types only.
- **Scope:** separate tenancy, template review, licensing, classroom consent, assignment controls, moderation/admin tooling.
- **Dependencies:** legal/business/product decision and mature admin.
- **Risks:** child-directed service obligations and IP disputes.
- **Privacy/safety:** separate policy/tenancy; do not reuse family data.
- **Cost:** substantial operations.
- **Tests:** tenant isolation, role matrix, template review.
- **Acceptance/DoD:** distinct reviewed product mode, not a hidden extension of family accounts.
- **Complexity:** XL.
- **Blocks launch:** no.

## P3.3 URAI memory and relationship graph integration

- **User value:** opted-in memories, places, and relationships can become stories without re-entering them.
- **Current evidence:** copy/types/plans; no live contract.
- **Scope:** versioned consent-scoped snapshot API, redaction, source attribution, revocation, subject consent, provenance in Passport.
- **Dependencies:** `urai-privacy`, Life Map, relationship graph, Passport contracts.
- **Risks:** secondary use of sensitive memories and third-party data.
- **Privacy/safety:** minimum necessary snapshots; no direct database coupling.
- **Cost:** low compute; high governance.
- **Tests:** consent grant/revoke, stale snapshot, deletion, cross-user denial.
- **Acceptance/DoD:** every imported fact has source, purpose, consent, retention, and revocation metadata.
- **Complexity:** XL.
- **Blocks launch:** no.

# P4 — Spatial and next-generation experiences

## P4.1 Replay/spatial story manifest

- **User value:** a completed story can become a private scene or memory replay in `urai-spatial`.
- **Current evidence:** memory-scene fields and Asset-Factory adapter; no spatial contract.
- **Scope:** versioned manifest for scenes, narration, captions, assets, interactions, privacy class, device fallback; signed asset access.
- **Dependencies:** P2 exports, Spatial runtime, Passport provenance.
- **Risks:** exposing private assets through immersive clients.
- **Privacy/safety:** manifest carries audience and access policy; assets remain private by default.
- **Cost:** generated 3D/audio/video assets require explicit budget gates.
- **Tests:** schema contract, fallback, access expiry, device QA.
- **Acceptance/DoD:** one synthetic story renders in web fallback and spatial staging with identical privacy/provenance receipt.
- **Complexity:** XL.
- **Blocks launch:** no.

## P4.2 AR/VR interactive and embodied narration

- **User value:** users can enter, explore, and influence story worlds.
- **Current evidence:** absent.
- **Scope:** interaction model, locomotion/accessibility, branching state, safety boundaries, parental controls, offline fallback, Quest/WebXR validation.
- **Dependencies:** mature spatial manifest and branch engine.
- **Risks:** motion sickness, child safety, recording/sensor permissions, high asset cost.
- **Privacy/safety:** explicit camera/mic/spatial permission and no passive collection by default.
- **Cost:** high; separate paid-generation approval required.
- **Tests:** WebXR/Quest, comfort, accessibility, permissions, recovery.
- **Acceptance/DoD:** reviewed prototype with synthetic content before any private user memory is allowed.
- **Complexity:** XL.
- **Blocks launch:** no.

## Execution order

1. P0.1–P0.3 establish reproducible truth and authorization.
2. P0.4 and P0.7 establish legal/product data boundaries.
3. P0.5 and P0.6 harden generation and sharing.
4. P1.1–P1.7 produce a defensible text-first V1.
5. P2 adds formats, media, collaboration, and languages behind explicit cost/privacy gates.
6. P3 adds continuity, creator modes, and URAI memory integration.
7. P4 adds spatial experiences only after provenance, private asset access, and device safety are proven.
