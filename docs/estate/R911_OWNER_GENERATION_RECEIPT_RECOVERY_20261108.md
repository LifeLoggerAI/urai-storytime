# R911 — Owner-only Storytime generation recovery receipts

**Production HOLD / review-only**. November 8, 2026 Central (GitHub UTC November 9). Child of R910 PR #108 head 5af562ba7ebf39b0466b245a81ddc232de5459e0. No production, Firebase deployment, real memory, provider spend, personal data or other worker branch was touched.

## Existing system and precise gap

The existing generation backend stores storyGenerationRequests under a server-owned, owner-prefixed document ID and includes source fingerprints, provider-budget state, cancellation and final session IDs. The existing listStorytimeProviderReconciliationQueue callable is **admin-only**. In R910 a mounted form now holds ambiguous failures to avoid immediately creating a fresh request ID, but it cannot recover its request after browser refresh or from another device. A user still needs truthful owner-scoped receipt visibility; Firestore Rules deny direct client access to storyGenerationRequests. Do not expose that collection through client Rules.

## Implemented changes

1. **functions/src/story-generation-recovery-contract.ts**: minimal owner receipt shape requestId/state/sessionId/updatedAt/retryAuthorized=false. Unknown, failed, held, legacy and needs-review statuses normalize to requires_review. Processing, cancellation requested and cancelled remain distinct. A completed private session ID appears **only if independently verified** by the server. No story content, sourceSignals, model prompt, consent snapshot, original source hash, provider token or billing receipt is returned.
2. **functions/src/story-generation-recovery.ts**: read-only getStorytimeGenerationRecovery callable requires authenticated Firebase UID and verified email, validates optional bounded request ID, reads exact owner-prefixed ID or at most 12 recent owner-filtered requests with a server-side query ordered by createdAt. Before returning ready session, reads original story and validates matching UID, requestId, SHA-based request review, status ready, approved, not revoked, and creative derivative provenance by existing isReusableStorytimeSession. Empty/not-owned/malformed IDs yield no disclosure. Returns retryAuthorized=false unconditionally.
3. **functions/src/index.ts** exports the callable.
4. **firestore.indexes.json** adds an ownerUid (userId ASC) + createdAt DESC composite index for bounded recovery queries. Client Firestore Rules stay DENY for storyGenerationRequests.
5. **src/components/storytime/StoryGenerationRecovery.tsx**: separate read-only recovery card in the private creation screen. Uses existing exact Firebase User object and auth epoch lease; masks old ready state immediately on account change, drops stale asynchronous success/error, shows only limited status labels and a server-verified completed session link. No generation, retry or mutation action.
6. **StorytimeHome.tsx** mounts the card without changing R910 generate request IDs, provider logic or consent.
7. **tests/unit/storytime-generation-recovery.test.mjs**: 10 original-source tests written for owner isolation, malformed IDs, sanitized response, completed-session verification, cancellation states, failed/held ambiguity, timestamps, backend read-only security, Rules and composite index.
8. **tests/e2e/storytime-generation-recovery-view.test.mjs**: 5 contract tests written for authenticated current actor, limited links, backend source boundaries, no raw data and index/Rules preservation.

## Exact source receipt and verification

R911 GitHub connector readback verified 19/19 static source invariants across all eight above files. Source blob identities at initial review:

| File | Git blob SHA-1 |
|---|---|
| Recovery contract | fbd18b874a88fefe7c7398bbe6c8e58b8ad18c86 |
| Callable | ed3da697df1250d62ebd0c11cb0d62224737a97c |
| Functions index | f7c414672ed745f4deca3b2fff419a5e57ee96d6 |
| Firestore indexes | 4bd4e61921b2d33f97f3ff07b174403f13ad6677 |
| Recovery UI | bc51938198025fd9d7a3a868803f64e415728718 |
| StorytimeHome | ea8f49c45151f222325e953c32405302e0767a7f |
| Recovery unit suite | 1bbd4b9823ff2e183291553e73a139bd3151dc63 |
| Recovery view suite | b3efbbfe9f2e4fcccce4eaa00242a3fd61c7bd67 |

Local Node v22.16.0 **7/7 isolated helper-equivalent fixture tests PASS** on owner denial, bounded identity, minimal output, approved-session verification, cancellation classes, failed/unknown and invalid timestamps. The local helper was **manually reconstituted and is not byte-identical to the actual connector-fetched repository source** (source comment and formatting omissions); do not claim exact-source hash verification or execution of the 10+5 committed test files. The separate 19/19 checks are static original GitHub source-contract readbacks, not emulator tests or executable UI tests.

The local container could not git clone (DNS error: Could not resolve host github.com). No exact-head frozen npm ci/typecheck/Next/Functions build; no real four-service Firebase Rules emulator; no two-Firebase-account React browser tests; no source-specific signed Privacy grant, private memory, payment, TTS provider, Jobs/Replay or production runtime acceptance. Pending native tests and no CI approval are **real blockers**.

## Important unresolved security and correctness boundaries

- **No durable global spend lock**: a read-only list does not prevent a separate tab/device from submitting a fresh request ID, nor reconcile a held provider charge. This release gate remains P0 and must not be advertised as implemented.
- The recent list covers only the most recent 12 owner records. Historic requests beyond that page require an exact known ID or further authorized reconciliation; absence in list does **not** prove no prior charge.
- The current interface has read-only receipts; users must not infer that an unknown receipt authorizes a fresh generation.
- A successful generated story is a creative derivative. The server's owner/story checks are not canonical Privacy-signed original-memory consent nor per-claim recorded-source verification.
- Completed story links need actual device/browser and Firestore owner-read checks, including a sign-out/sign-in or same UID new Firebase User instance during request completion.
- Actual deployed Firebase project identity remains unresolved; local .firebaserc contains placeholder. No production deployment authorized.
- Auth SDK state changes after initial backend query but before response must be tested under physical browser; frontend uses existing actor lease.
- Reconciliation of provider charged-but-timeout statuses, reservation and deletion receipts, downstream Jobs/Studio/Spatial protected Replay, and child/third-party consent still P0.

## Next worker exact path

Refresh this PR source head and CI runs first. On a trusted full checkout execute root npm ci + npm test + npm run typecheck + npm run build, Functions npm ci/build, then genuine four-emulator Auth/Firestore/Functions/Storage owner/other/admin/signed-out tests. Add synthetic user A/B request fixture, malformed record, succeeded session wrong owner/changed hash/safety/revoked, partial provider-held receipts, pagination/ordering, stale browser auth callbacks, index/no-index failures, and simultaneous duplicate generation under different request IDs. Independently implement server-owned per-user unsettled-generation lock with transactionally enforced lifecycle and explicit provider charge reconciliation before accepting cross-device no-duplicate-spend. Prove signed Privacy original-source rights and revocation/deletion separately. Keep all independent PRs, main, real memories and paid providers untouched until approved. **Production HOLD.**
