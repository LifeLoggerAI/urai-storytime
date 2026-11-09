# ONE URAI GENESIS — R908 Storytime Complete Forensic Reconciliation

**Review only / production HOLD.** Audit date: 2026-11-08 America/Chicago (some GitHub receipts recorded 2026-11-09 UTC). Repository: LifeLoggerAI/urai-storytime. This is an additive, public-source forensic continuation; it does **not** certify completion, authorize private memory access, pay providers, deploy Firebase, alter saved stories, or merge any worker branch.

## 1. Exact authority and coverage

| Authority | Immutable SHA / observed result | Classification |
|---|---|---|
| Current main | 73f586a0a2931961ae221af7cfc0caf1b6aef39d | 306 blobs, 53 dirs, 1,356,257 Git-reported bytes; complete recursive tree metadata |
| Current owner engineering PR #83 | 33ecc480ffe96e83647a29e09969defeb84ca3fd | Draft, unmerged, based main; integration candidate |
| Disposable Storytime–Jobs PR #96 | 31cf72a01b65667de89c9ad565b6f0a4e51759a0 | Draft; exact-head Oct 15 historical successful CI and disposable Firebase emulators |
| Target-identity PR #97 | 312240f5da9042a2cc9d11dac179bed90dee51d1 | Draft, 355 files and 1,946,848 Git-reported bytes; newer exact-head checks red |
| Forensic registry PR #99 | a1d9153a8b9308090649f2ede0f0eb7b43d74db8 | Draft, complete 96-branch-head historical metadata and 01–09 audit pack; no full raw-byte claim |
| Server-owned generated records PR #100 | f0efee038d0acdcf8c74f4108c03c41e32bedfd1 | **Independent draft**, not inherited by PR #105 |
| Account-switch list PR #101 | 598c969fe4a258331c442692887903bacadf42fa | **Independent draft**, not inherited by PR #105 |
| Account-switch form PR #102 | 9be92015f1f9b42101e224aedf92807d0777cdcb | Draft child of #101, not inherited by PR #105 |
| Request binding / retry PR #103 | 57b54044bb6e61713c75ba559166a1128244dc19 | Draft child of #97; focused Node and static tests only |
| Atomic local persistence PR #104 | 94022314d331cac68fe48e93d52f438a12c1e96d | Draft child of #103; contract tests authored, not native-run |
| Source-attribution PR #105 | c01963408da4deabcc27a98156bafcd1f7b10ab7 | Draft child of #104; **363 Git blobs, 56 dirs, 1,983,260 Git-reported bytes**, full untruncated head tree |

The complete 363-path PR #105 path/mode/blob-SHA-1/size metadata inventory is in [R908_PR105_EXACT_HEAD_FILE_INVENTORY.json](R908_PR105_EXACT_HEAD_FILE_INVENTORY.json). Prior [PR #99](https://github.com/LifeLoggerAI/urai-storytime/pull/99) includes [MANIFEST.json](MANIFEST.json), eight **history/BRANCH_TREES_*.json** records and **history/BRANCH_HEAD_AGGREGATE.json**. Their preserved snapshot covers 96/96 then-visible branch heads (28,282 repeated path entries; 4,680 distinct paths; 4,760 distinct blob SHA-1s; 66,472,643 distinct Git-reported bytes), with 0 recursive-tree truncations. A fresh November 8 GitHub branches listing returned **102 names** across two API pages **before the R908 branch was added**; the historical 96 list is a dated snapshot, not a current exhaustive listing. Branch-head trees do not cover every intermediate/deleted/unreachable commit.

**Raw-byte integrity limitation:** a Git blob SHA-1 and Git-reported size are NOT a SHA-256 receipt. In R908 exactly one helper was materialized and independently hashed: src/lib/storytime/redaction.ts, 974 UTF-8 bytes, Git blob SHA-1 **4a0e97ed2d6d0c8798ed8ff25b40895d2e8136ae**, raw SHA-256 **d21b5a7b84ed6564f5108c43f0b065b02d71e430101e1b8eafb88d214bde1953**. The remaining 362 current-head blobs are path/size inventoried but not independently raw-hashed in this continuation. Selected substantive source was read via authenticated GitHub connector, not cloned into a complete original working tree. No remote private media or user account records were accessed.

**Media inventory:** the PR #105 tree contains two SVG source artwork files and source/config/test documents, but zero tracked files with the selected common native audio, video, raster-image, 3D-model or archive extensions (.mp3/.wav/.mp4/.png/.glb/.zip etc.). Across historic 96 branch-head inventories, the same selected native extensions recorded zero. Neither observation proves Cloud Storage, external provider, Git LFS, removed commits, other formats or private licensed assets are absent. Largest old branch local-next-build-fixes@5ae2bde986f1eb30f516e8774ebe31a524abab42 contains 4,229 tracked blobs/60,830,012 reported bytes, mainly committed functions/node_modules; its content is not the active runtime.

## 2. Actual Storytime architecture and capability matrix

| Capability | Current-source anchors | Verified classification / limit |
|---|---|---|
| Next/React story UI, account and private session routes | src/app/storytime; src/components/storytime; src/lib/firebase | Source exists; authenticated device and deployed owner-only journey **unverified** |
| Direct-input narrative generation | functions/src/storytime.ts; functions/src/story-provider.ts | Actual structured provider adapter; live provider call, spend and protected source acceptance **unverified** |
| Nonproduction deterministic story builder | src/lib/storytime/story-builder.ts; functions/src/storytime.ts | Actual local story construction; backend explicitly nonproduction-gated; not proof of real-life event |
| Session, chapter, moment, memory-scene, narration-text, emotional arc | functions/src/storytime.ts; types.ts; record builders | Implemented records and persistence paths; narrative is **creative derivative, not historical source evidence** |
| Private draft save/resume and revocation-aware revisions | functions/src/story-drafts.ts; story-versioning.ts; StoryRevisionEditor | Real owner-scoped source implementation; runtime account-switch and race acceptance incomplete |
| Request review, consent, quota/budget and idempotency | GenerateStorySchema; story-provider.ts; storyGenerationRequests | Real guards and receipts; canonical signed source/Privacy permissions still missing |
| Output moderation and safe-sharing lifecycle | moderation-operations.ts; public-story-share-lifecycle.ts | Real source; public share publishes a fixed safe placeholder, **not a genuinely redacted full private story** |
| Narrator scripts and weekly scroll/arc/timeline/archive | functions/src/generate-*; refresh-story-timeline.ts; rebuild-user-story-archive.ts | Database artifacts, not equivalent to generated audio/movie |
| Voiceover transfer to Jobs | storytime-voiceover-consent-admission.ts; Storytime–Jobs bridge | Executable source handoff; live protected audio provenance, playback, revocation and deletion unverified |
| Private Storytime export/deletion | privacy-requests.ts; privacy-execution.ts | Scoped source plan/receipt and guard logic, NOT full UrAi/third-party/provider/backup physical deletion proof |
| Life Movie truth graph | src/life-movie-story-graph.mjs | Implemented pure truth-class model; not wired to sentence-by-sentence runtime generation |
| FINITE TIME shot/canon plans | src/lib/finite-time/* | Governed preproduction source, final render authorization false |
| Studio/Content/Spatial/Asset Factory envelopes | src/lib/storytime/integration-contracts.ts; asset-factory.ts; media-job-contract.ts | Versioned, intentionally hard-off or preproduction; no accepted downstream live delivery |
| Locales/accessibility | locales.ts; a11y source/tests | English enabled; 19 other locales hard-off, not 20 production-ready; device evidence pending |
| Genuine recorded UrAi memory graph ingestion | sourceSignals, memoryUse, memory_snapshot type | **No verified live authenticated resolver or immutable original-source receipt in generation path** |

**Source-generated flow:** Firebase authenticated actor with reviewed sourceText/title/tone/motifs and generation/provider-processing flags → versioned request SHA + quota/spend admission → configured structured OpenAI adapter OR nonproduction deterministic builder → output moderation → Firestore session/chapter/moment/scene/script/arc/immutable version and receipt → optional downstream bridge. The callable stores provenance sourceType **direct_storytime_input**, sourceId **requestId**, fictionalized=true, factualStatus **creative_derivative_not_source_evidence**. These fields prevent a session-level false claim; they do NOT ground each assertion or prove a memory graph source was retrieved.

## 3. Source-to-story truth and correction ledger

**Nonnegotiable hierarchy: recorded source ≠ attributed human recollection ≠ AI-generated interpretation.** Do not treat a convincing AI scene, generated voice, family anecdote or draft sample as independently recorded historical fact.

| Category | What exists now | Required factual/permission evidence before promotion |
|---|---|---|
| Submitted sourceText, title, motifs and tone | User-supplied direct narrative input delivered to provider/local builder | Retain as testimony/input with exact reviewed hash and actor; **not independent recording** |
| sourceSignals labels and memoryUse checkbox | Client-provided labels/bool; stored metadata | NOT a memory artifact, capture receipt, source ID signature, rights grant or consent issuer |
| Recorded event/photo/video/audio | Schema mentions memory_snapshot; no active fetch/read in inspected generation function | Owner-scoped immutable asset ID/hash, original capture time, access grant, third-party rights, current Privacy authorization, exact byte verification |
| Human/family recollection | Life Movie graph has attributed recollection class, source text/ID | Recollector identity attribution and original wording/date, explicit privacy permission, contradictory testimony preserved as disputed |
| AI reconstruction | Provider receipt, story version, creative-derivative class and text | Model/version/prompt/input/output digests, mark fabricated transitions, never silently elevate to verified memory |
| Unresolved/contradictory claims | Historical truth class UNKNOWN_UNRESOLVED and graph categories | Claim-level source/support/dispute ledger and visible uncertainty; two conflicting sources must remain conflicting |
| User correction/edit/restore | Immutable story versioning and revision controls | Preserve original source unchanged; classify correction as remembered assertion, supported fact or editorial change; editor actor/time/reason |
| Narrated audio or video derivative | Narrator-text source and Jobs queue; final render contracts | Signed owner+purpose+source consent, immutable story/version/source ledger, provider/asset hashes, recipient-limited delivery, revocation/deletion |
| Public-safe derivative | Fixed placeholder share and revoke control | Human review of actual redaction, semantic leakage/PII checks, expire/revoke/cached URLs and third-party consent |

**Verified R907 provenance defect/correction:** functions/src/storytime.ts at PR #105 Git blob **809154cc65156e54e209292e8df87bdbd1074803**, helper redaction.ts blob **4a0e97ed2d6d0c8798ed8ff25b40895d2e8136ae**. Original explanations claimed creative narrative came from sourceSignals and displayed raw label values. Actual providerInputFromRequest passes title, sourceText, tone, motifs, locale and audience—**not sourceSignals**; local builder also only records sourceSignals as metadata. PR #105 corrects both explanations to say user-input creative reconstruction, source labels unverified/not used as narrative evidence, and removes raw label echo. **Old stored whyGenerated records remain unchanged**, as must be true absent specific owner-authorized migration. StoryPlayer currently renders that stored explanation.

**Future claim ledger—not currently implemented end-to-end:** claimId, immutable supporting/contradicting source IDs and original hashes, capture/recollection dates, claim class, actor and edit history, signed issuer/grant/purpose, consent version and revocation generation, model/prompt/output hashes, downstream derivative IDs, deletion status. Do not write private claim text or user IDs into a public forensic repository.

## 4. Owner authorization and privacy matrix

| Operation | Actual source boundary | Outstanding proof |
|---|---|---|
| Generate private story | Firebase UID/email verification, operator adult-or-guardian assertion, source review, generation/provider flags, current request fingerprint | Authenticated **Privacy-issued owner+original-source+purpose-specific consent**; guardian/third-party legal authority; revocation after delays |
| Read private story and draft | Owner query, Firestore Rules and frontend auth state | Actual two-account negative emulator/browser tests and account switch during pending reads |
| Draft autosave/delete and creation form | Existing owner-transaction code; PR #102 proposes exact-auth-epoch form fence | #102 remains independent from #105; test stale autosave, delete and local sourceText leak under actor switches |
| Generated canon and audit records | Backend writes; PR #105 Firestore Rules still allow client creates/updates to many generated records; auditLogs allow any signed-in create | PR #100 separate, unmerged, independently prove server-owned canon/provenance and privileged Admin SDK/IAM |
| Reuse generation requestId | PR #103/#105 checks exact reviewed+provider SHA, owner/session, approved/not revoked and terminal states | Actual concurrent transaction/unknown status/retry+charge reconciliation; compatibility with old incomplete requests |
| Cancel final output | PR #104/#105 nonproduction local final write now Firestore transaction, paid path already has separate protected transaction | Real cancellation concurrent emulator tests and no story/version/extra spend on denial |
| Share/revoke | Owned story, backend share lifecycle and fixed placeholder | Real public-route/cache/download revocation, consent rights for shared people |
| Jobs narrator | Owned Storytime script/session and staged receipt; downstream bearer-token bridge and Jobs purpose-level block | Jobs does not independently validate canonical **signed** Storytime decision receipt; live owner-only audio, expiry, cancel, storage/provider purge |
| Account export/deletion | Storytime own scoped plan and server-only execution source | Whole UrAi cascade, family holds, failed half-deletions, backups, provider purge and typed completion receipts |
| Moderator/admin | Admin claim checks and minimized moderation records | Real IAM/custom-claim entitlement, cross-owner access refusals, audit and appeals |
| Studio/Content/Spatial/Replay | Source identity envelopes and hard-off flags | Signed per-derivative consumption grant, protected view auth and after-revocation denial |

Self-reported operator roles, sourceSignals labels, consentSnapshot.memoryUse, mere Firebase project IDs and valid-looking request IDs **do not establish source ownership**. Firebase Admin SDK bypasses client Firestore Rules, so backend and provider IAM are a separate required authority plane.

## 5. Cross-repository integration contract ledger

| Edge | Inspected evidence | What is NOT verified |
|---|---|---|
| UrAi Life Map/memory graph → Storytime | storytime.ts/Storytime types plus separate Life Movie graph | Real signed owner-selected source import, original hashes, conflict preservation, Privacy issuer and deletion event |
| Storytime → Jobs voiceover | Storytime admission and Jobs functions/src/jobs/storytimeNarratorBridge.ts (Jobs main blob cec3a4f6638aa3d646457b08f7c24e99cf4715a3) | Jobs independent consent issuer, tenant-bound job/asset readback, provider receipt, current revocation during retries, backup deletion |
| Storytime → Studio | buildStudioNarrativeGraphEnvelope and Studio media production references | Studio actually consuming signed private story version and rendering approved protected output |
| Storytime → Content | buildContentStoryPackageEnvelope; Content registry/envelope names Storytime | Public/private editorial publishing and localization approval; Content's own cross-repo runtime contract marks edge RED |
| Storytime → Asset Factory | HTTP adapter and execution flag default false | Real approved asset, license, provider cost, private owner asset retrieval |
| Storytime → Spatial/Replay | buildSpatialReplayManifestEnvelope and Spatial tier2 storytime classification | Authenticated replay of approved story media, captions/reduced motion, device evidence and revoke/delete propagation |
| Storytime → Privacy | Storytime's own privacy operations and Jobs purpose block | Source-by-source signed canonical Privacy receipt, cross-project actual grant and whole-account deletion |
| Storytime → Admin/Analytics | Admin moderation/source events and minimal analytics type contracts | Live IAM least privilege, privacy-safe analytics retention and admin nonaccess to unrelated memory |

The repo's .firebaserc default project remains **REPLACE_WITH_URAI_STORYTIME_STAGING**. A name or template cannot prove the deployed Firebase project, Hosting target, IAM role or effective Rules owner. No production project/region/bucket was certified for Storytime.

## 6. Test and CI evidence — preserve exact heads

| Exact source | Evidence | Interpretation |
|---|---|---|
| July historic PR #24 @ 0ea33e1049b122db9bdfc518032cb2c84777d267 | Drive July receipt: 58/58 original source, 16/16 smoke, app/Functions builds | Historical isolated tests; **not** Firebase runtime or production user story |
| PR #96 @ 31cf72a01b65667de89c9ad565b6f0a4e51759a0 | Actions CI 38685224348, Verify 38685224444, Visual 38685224333 **SUCCESS** Oct 15; real disposable Auth/Firestore/Functions emulator job, Functions build | Historic exact-head synthetic fixture acceptance only; does not transfer to newer #97–#105 |
| PR #97 @ 312240f5da9042a2cc9d11dac179bed90dee51d1 | Three Actions red; previous owner report 36/36 local guard assertions | No current certified build/emulator; do not call red Actions an app-test failure absent logs |
| PR #103 @ 57b54044bb6e61713c75ba559166a1128244dc19 | Prior worker exact two-file Node22 selected tests 5/5, 12/12 static readback | Focused helper/invariant coverage; full callable+Firebase suites missing |
| PR #104 @ 94022314d331cac68fe48e93d52f438a12c1e96d | Five cancellation source-contract tests written | Not native executed; real emulator race unverified |
| PR #105 @ c01963408da4deabcc27a98156bafcd1f7b10ab7 | Prior worker 2/2 helper tests and four-case regression authored; **R908 independently executed 10/10 original-byte helper synthetic tests** Node 22.16.0 | Verifies only one source helper's privacy explanation and simple regex behaviors, not full four-case repo regression or backend |
| PR #105 current Actions | CI 42536900659, Verify 42536900653, Visual 42536900738 all **FAILURE** Nov 8 UTC; failing jobs have empty runner and 0 steps; Job logs return **404 BlobNotFound** | Failure reason **unknown**, no evidence tests actually ran; native emulator/prod jobs skipped |
| PR #99 current Actions | CI 42536924815, Verify 42536924817, Visual 42536924814 all failure | Documentation head not source-certified, no inherited green |

**R908 isolated native test details:** exact original redaction.ts 974 bytes / sha256 d21b5a7b84ed6564f5108c43f0b065b02d71e430101e1b8eafb88d214bde1953. Node v22.16.0; 10 synthetic tests PASS: empty/unverified source labels, single/multiple sensitive labels, hostile labels, non-Latin label, and name/address/email/phone regex examples. The public-share regex test cases are **not** a generalized privacy or safety certification. Full cloned repo, frozen lockfile install, TS compile, Next/Functions build, Firebase emulator, real owner browser and protected Jobs/media were **not executed** in R908. Container GitHub DNS failed; source was fetched through connected GitHub and locally reconstructed for the helper only.

No independent PR #99/#105 reviewer approval exists. Production and provider spend remain HOLD.

## 7. Historical StoryTime authority conflict

Original recovered branch local-next-build-fixes, May 11 **2026** Git commit 5ae2bde986f1eb30f516e8774ebe31a524abab42, contains file **AUDIT_2024-10-26.md**, STORYTIME_LOCK.md, DOCTRINE.md, ARCHIVE.md, FORWARD_CRITERIA.md, old functions/index.js and two frontend roots. The 2024 filename is a historical document date, **not an independently proven 2024 Git commit/deployment**. Historical restricted parent-led calm child experience explicitly rejected behavior tracking, emotional inference, intensity escalation, reward loops and personalization. The current adult/guardian-operated creative story/emotional arc system cannot inherit child-personalization permission from that historical authority. The historic audit claimed pre-rendered Cloud Storage MP3 templates; its callable still generated placeholder prose and built signed URLs for voice/v1/*.mp3 and images/v1/*.png. No actual object was accessed or verified. Preserve both historical systems; do not merge policy restrictions away or certify absent media.

## 8. Prior-worker reconciliation / conflict map

- **Engineering owner #83 → #96 → #97** is one unmerged source chain, with exact-head emulator success only at #96.
- **Safety siblings #100 (server-owned Rules) and #101 → #102 (account-switch isolation)** are independent from the **#103 → #104 → #105 (idempotency/cancel/source-truth)** chain. #105 **does not** contain #100 or #102 safeguards. An integration/rebase must include file-by-file review, signed Privacy/owner tests and exact new-head CI; no forced merge or inherited green.
- **Documentation #98 → #99 → R908** is independently layered over main/bootstrap docs and does **not** install runtime/security source changes into main.
- Labs master private PR #262 holds central registry protocol; private registry facts must remain private. This public pack references only observable public repo evidence.
- Historical branch-head metadata and previous workers' PRs remain intact. No production, source-runtime or real user records were modified by R908.

## 9. P0–P3 completion backlog, ranked

**P0 — cannot ship memory-origin Storytime:** (1) establish actual authorized Firebase target/IAM/Rules namespace with source, deploy and rollback receipts; (2) recover runnable CI, exact-head frozen installs, typechecks, app/Functions builds and real four-emulator auth/Rules; (3) independently reconcile #100 and #101/#102 and #103/#104/#105 into one reviewed candidate without overwriting workers; (4) require canonical Privacy-signed original-source/actor/purpose/expiry/revocation authority on ingest/generation/Jobs/output; (5) reproduce owner A vs B, stale account, races, forged provenance, requestId reuse, cancellation, moderation, unexpected spend and deletion denial; (6) prove owner-only protected Jobs narration and whole-account/provider/storage/backup purge; (7) independent approval and launch gate signoff.

**P1 — factual reconstruction correctness:** (1) implement real authorized memory-graph source resolver, immutable artifact byte hashes and captured/recollected class; (2) claim/scene-level support, contradiction, confidence, disputed labels and human corrections without overwriting originals; (3) fix historical saved whyGenerated overclaims **only by an owner-approved version-preserving migration**; (4) real safe-share redacted-content review and uncacheable revocation.

**P2 — governed product readiness:** (1) physical browser/mobile, keyboard, screen reader, 48px/reduced motion/captions and privacy explanations; (2) guardian/child/third-party likeness/voice legal and consent review, separate historical child doctrine; (3) moderated appeals and privilege review; (4) native approval of 19 non-English locales; (5) Studio/Content/Asset Factory/Replay full protected derivative acceptance if activated.

**P3 — exhaustive forensic closure:** (1) independently SHA-256 raw bytes of all accessible Git objects and LFS actual objects, correlate to known SHA1 modes; (2) current all-branch-head metadata beyond old 96, every reachable/intermediate/deleted commit, tags, retained Actions artifacts/logs; (3) authorized Storage/provider/media/asset licenses/retention and historic 2024 source history; (4) inter-repo API/source/CI/deployment hash crosswalk and worker concordance.

## 10. Readiness decision

**R908 finding:** the story application and many protection mechanisms are implemented in source, with carefully bounded local tests. A private **recorded-source-grounded and consent-authorized** Storytime narrative, protected Jobs audio, full claim provenance and consumer Replay have **not** been independently accepted. Existing source must be preserved, not reinvented; the current release stays **HOLD**.

**Evidence types:** inventory = GitHub reported tree metadata; source semantics = direct original GitHub file read; helper tests = exact-blob-verified isolated native Node; workflow states = original GitHub run and job receipts; user memories/media/production = not accessed or verified. This document does not claim more.
