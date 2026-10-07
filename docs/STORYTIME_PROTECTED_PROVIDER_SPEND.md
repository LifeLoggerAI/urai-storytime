# Storytime provider spend admission

The former provider leaf submitted OpenAI requests after environment configuration alone. Its caller treated token usage multiplied by configured rates as an actual settled charge and released both daily reservations. This donor routes the actual leaf through the canonical Factory v2 gateway and keeps usage observations separate from settlement.

## Source and owner boundary

The donor is stacked above Storytime revision owner #85 at `dbea0b2daeb41d3c63b0d53f1cbc6f0a275e6353`, retaining dependency owner #83 at `49857678162d895f3a41b537496bdb84c9b263f3`. It changes provider, helper, necessary generation-claim/budget caller wiring, tests and this handoff only. Revision source, history/index ownership, voiceover bridge, private sharing, moderation, supported `en-US` language and main remain unchanged. Independent canon #84 is not admitted.

Pair with Factory gateway donor #443 at `047c8429626300c9896bc8c4b739b5902575ad38`; its actual `productionSpend.ts` Git blob is `1bdf4e1d6b21cdf95a55984c1d81a83dfcec8021`. The copied fixture is pinned to that complete UTF-8 blob. The original Storytime provider fixture is pinned to Git blob `9178b980a5d4287b5537169bc6fbee933220a567`. Fixtures contain synthetic storage, account identities, credentials, approvals and verifier keys; they cannot authorize production.

## Protected provisioning contract

Environment settings locate configuration and remain kill switches. They do not authorize a request. `STORYTIME_PRODUCTION_SPEND_URL` must be the canonical public HTTPS `/api/worker/production-spend` route. `STORYTIME_SPEND_GATEWAY_SOURCE_SHA` identifies the actual paired Factory source. `URAI_SOURCE_SHA` must match this executor's actual clean, tracked Git HEAD and all three enforcement source paths. A runtime without verifiable Git provenance stays closed; a declaration cannot substitute for independently verified compiled/deployed source evidence.

The generation callable mounts the protected Firebase secret `STORYTIME_SPEND_WORKER_TOKENS_JSON`, whose object maps protected worker IDs to distinct worker tokens. The Factory registry must separately bind each token to executor repository `LifeLoggerAI/urai-storytime`, exact source, consumer `storytime-generation`, tenant digest, OpenAI API account and the actual credential digest. No product code creates these registrations, financial jobs, signatures, grants or account readbacks.

The server-owned processing claim records owner/request, the exact reviewed request SHA256, canonical provider-input SHA256 and explicit consent snapshot. The helper calculates:

* `source_input_sha256`: SHA256 of stable sorted JSON `{authority:{userId,requestId,reviewedRequestSha256},input:<actual provider input>}`.
* `request_sha256`: SHA256 of UTF-8 `POST\nhttps://api.openai.com/v1/chat/completions\n` followed by the exact frozen JSON body bytes.
* `credential_sha256`: SHA256 of stable sorted JSON of the actual normalized `authorization` header.
* `semantic_headers_sha256`: SHA256 of stable sorted JSON of the other normalized explicit headers, including content type.
* Tenant digest: SHA256 of the verified authenticated owner ID.
* Protected locator: SHA256 of stable sorted JSON `{user_id,request_id,reviewed_request_sha256,request_sha256,source_input_sha256}`.

Protected provisioning supplies `storytimePaidProviderBindings/<locator>` with `user_id`, `request_id`, `generation_request_id` (the existing `<owner>_<request>` processing claim), reviewed/source/request/credential/semantic-header digests, provider `openai`, executor/gateway SHAs, `job_id`, `worker_id`, `account_id`, consent/rights receipt digests, nonempty `receipt`, `trusted_readback:true`, current complete ISO `observed_at`/`expires_at`, and no revocation.

`storytimeProviderConsentReceipts/<consent_receipt_sha256>` and `storytimeProviderRightsReceipts/<rights_receipt_sha256>` must be independently established server records whose whole stable sorted JSON hashes equal their IDs. Both bind owner/request/claim, reviewed/source digests, provider `openai`, purpose `storytime.generate`, current trusted readback, receipt identity and no revocation. Consent requires `status:GRANTED`, `story_generation:true`, `provider_processing:true`, and `consent_version:story-generation-consent-v1`. Rights requires `status:APPROVED` and `rights_reviewed:true`. Existing Firestore default-deny rules keep these new unmapped paths client-inaccessible. A caller checkbox, environment token or synthetic fixture cannot manufacture these protected proofs.

The approved Factory job must include all four source/request/consent/rights digests in its signed input list. Its v2 executor binds exact worker, tenant, repository/source, gateway repository/source, endpoint, model, credential, headers, content type, request size and asset `storytime/<tenant digest>/<request ID>/session`. Authentic independent deployment/control proofs, signed explicit bounded approval, actual account credential mapping, current global balance and fresh protected pricing are required by the canonical gateway before atomic admission.

The fresh signed budget rates additionally bind `input_usd_micros_per_million_tokens` and `output_usd_micros_per_million_tokens` to the configured observation rates. The canonical per-unit quote must cover the conservative token ceiling, the full protected cap must fit inside the local per-request ceiling, retries must be zero and runtime at most 20 seconds. The elapsed-time output fence also follows the outcome record and final authority awaits. Canonical account contention and independent final-charge reconciliation retain their existing authority.

## Hold and outcome behavior

The exact request body and effective headers are frozen before admission and dispatched once, with redirects rejected. A credential environment change cannot replace the admitted credential. Coherent server authority and source fixity are rechecked before and after reservation and after decoding. One protected deadline covers response headers, body decoding and output safety checks. Missing, stale, cancelled, revoked, mismatched or unavailable evidence blocks output/dispatch at the applicable boundary.

Provider outcomes use only the gateway's `record` action and remain `RECONCILIATION_REQUIRED`; they never call `reconcile`. Lost reserve replies, provider failures, body timeouts, invalid reservation echoes and failed outcome observations never trigger resubmission or release money. The caller retains its entire local per-request ceiling in both global and owner daily counters, counts earlier unknown holds against new requests, and rejects malformed counters. A successful story can retain a usage observation while its charge remains unresolved.

Paid receipts have `actualCostUsd:null`, `observedCostUsd:<token price observation>`, `costStatus:priced_usage_observation`, `settlementStatus:RECONCILIATION_REQUIRED`, and an exact protected spend observation with `chargesReconciled:false`/`retryAuthorized:false`. Local deterministic builder receipts retain `NO_PROVIDER_SPEND`; provider admission failures never fall back to that builder. Uncertain generation requests retain the terminal `requires_reconciliation` retry barrier and tell the caller not to submit a replacement.

Paid story persistence carries an internal closure bound to the admitted request and original authority. Current claim, binding, consent and rights reads share a Firestore transaction with all story writes and the successful request transition. Grant revocation or late cancellation conflicts with that transaction; a retry repeats only the current authority read and staged story writes, never provider submission or spend admission. Source provenance is checked before those writes. The existing commit-acknowledgement reconciliation path still distinguishes an atomically persisted story from an unconfirmed output while retaining all financial holds.

Only a separately authenticated, independently signed final charge receipt can settle the canonical account. This donor does not add a local daily-hold release actor; local holds remain conservative until an independently governed reconciliation path can bind the genuine final canonical charge to the same owner/request/reservation. Old reservations or approvals are not automatically migrated, released or reopened.

## Validation and remaining boundaries

The focused execution test exercises the actual predecessor leaf, repaired provider, generation callable and exact canonical gateway logic using explicitly synthetic transactions and Ed25519 evidence. It proves the predecessor's environment-only POST, exact-byte dispatch, owner/consent/rights/source/pricing rejection, frozen credentials, lost reserve/record behavior, full-body deadline, unknown-hold retention and malformed/daily-budget rejection. It does not demonstrate genuine protected deployment, real grant/account provisioning, provider spending, emulator-loaded Functions, distributed revocation/deletion or final production acceptance.

Fresh native verification must run on the exact published donor and, after deliberate admission, on the combined successor. Earlier donor evidence is historical. This change makes no merge, deployment, signing, provider, family-media or production approval claim. Rollback reverts this bounded donor without releasing or reopening retained reservations.
