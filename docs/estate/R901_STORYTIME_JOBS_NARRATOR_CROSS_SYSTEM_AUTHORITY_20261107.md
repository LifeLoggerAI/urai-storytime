# Storytime ↔ Jobs narrator — exact-source trust boundary reconciliation

**Classification:** source-level readback, NOT protected staging, not real user media, not production acceptance. November 7, 2026; PRODUCTION HOLD.

## Source identities and system separation

- Storytime active engineering candidate: PR #97 `312240f5da9042a2cc9d11dac179bed90dee51d1`. `functions/src/storytime.ts` Git blob `4c280569c4a92426070e0e5e8f9189c1aa6713b6`; `functions/src/storytime-voiceover-consent-admission.ts` blob `43d44560d392b7be908ba5d38e855828eb7f7d77`; source regression test `tests/unit/storytime-voiceover-consent-admission.test.mjs` blob `699ef7ba35c419027a5a7040ba0b65a38030e1f2`.
- Jobs current main source file `functions/src/jobs/storytimeNarratorBridge.ts` blob `cec3a4f6638aa3d646457b08f7c24e99cf4715a3`. Its repository head must be re-fetched before any runtime promotion.
- Storytime `prepareVoiceoverJob` validates Firebase owner auth and script/session record, checks `consentSnapshot.voiceover=true`, creates a Firestore consentDecisionReceipt plus an idempotent intent in a transaction **before** remote Jobs POST; rechecks source and receipt during local output job binding. Incomplete/ambiguous remote acknowledgment goes to reconciliation; synthetic tests cover source change and request collisions.
- Jobs bridge accepts only POST, bounded payload, bearer token equal to configured server secret by timing-safe digest (development emulator may allow absent token if nonproduction and FUNCTIONS_EMULATOR=true), Zod user/session/script/consent values, and a `consentBlockRef(userId,'storytime.voiceover')` active negative state. It writes a pending `narrator.tts` job, queue record and idempotency binding in a local transaction. That is an actual source integration, not merely a design stub.

## Authority matrix: what is real and what is missing

| Step | Proven by inspected source | Not independently proven |
|---|---|---|
| Frontend request → Storytime callable | Firebase UID, verified owned session and script checks | Signed canonical Privacy owner+source-specific issuance for real memories, guardian/third party rights, Auth freshness at external handoff |
| Storytime → Jobs token | Server-side bridge token, HTTPS enforced under NODE_ENV=production, bounded request | Production Secret Manager/issuer identity, short-lived identity federation or cross-project role scoping, secret rotation/deployment |
| Consent | Storytime source snapshot and server-durable consent receipt staged before dispatch; Jobs checks global purpose block | Jobs does **not visibly read or authenticate the Storytime consentDecisionReceipt itself**; its consent receipt ID and userId are taken from the token-authenticated HTTP request; no cross-project signed receipt proof |
| Job admission | Jobs binding fingerprint, pending queue, ownerUid/sourceSystem references | Authorized real endpoint execution, provider spend/retention, current account owner's consent after queuing |
| Status/cancel | Jobs exact bound source/user/job ID checks | Cross-system current revocation proof at every async step, races under real transport |
| Audio playback | Jobs checks successful bound job, expected bucket/path prefix, five-minute signed URL; Storytime separately re-reads current session/consent after bridge response | Physical protected audio readback, URL recipient isolation after issuance, token replay, expired or revoked signed URLs, provider output deletion/retention |
| Delete-output | Jobs reads bound successful job location, deletes GCS object, then writes job tombstone | Cleanup when job never reaches SUCCESS, queued/failed/cancelled but leaked artifacts, partial failures between object delete and Firestore tombstone, backup/provider retention |

**Important caveat:** Jobs checks a purpose-level revocation block for create; it does not directly establish that `storytime.voiceover` receipt in Storytime's separate project was authentic/current. This is a cross-service trust requirement, not proof of exploit against the trusted token. Storytime's local server-only Firestore rules are currently loose and source-authoritative fields can be client-mutated; the isolated safe proposal [PR #100](https://github.com/LifeLoggerAI/urai-storytime/pull/100) addresses that subset. It is unmerged and untested in native emulators.

## Source truth hierarchy

A narrator job is audio derived from an editable Storytime creative script, NOT recorded audio evidence of a user's original event. The source consent used for voiceover is not automatically authorization to process original media, clone a real voice, reproduce third-party likeness, share publicly, or train a model. Require immutable StoryVersion ID and source bytes/claim-class ledger before any truthful 'replay' label.

## Required acceptance

P0: independent Jobs and Storytime exact-head fixture integration using four Firebase emulators and identity-specific revocation, real provider off; token-negative and mismatched job/owner/session/script tests; cancellation, dispatch timeout, absent status, stage after revocation and output deletion races. Before protected production activation, use an owner+purpose+source-scoped signed consent issuer and verify on Jobs side or independently validated delegate; prove IAM project identity, protected audio readback, retention/backup and deletion receipts. No paid provider or private real memory tests unless separately authorized.

No remote endpoints, external provider, Firebase production resources or private user media were accessed during this cross-source read.
