# R904 — Storytime reviewed-source fingerprint and owner-session idempotency

**Classification:** focused original-source helper check, not full project acceptance. **PRODUCTION HOLD**. Snapshot: `2026-11-07` Central / `2026-11-08` UTC.

## Exact-source finding
At engineering PR #97 `312240f5da9042a2cc9d11dac179bed90dee51d1`, `functions/src/storytime.ts` `claimGenerationRequest` returns a prior successfully generated `sessionId` whenever a caller supplies the same owner UID and request ID. It does this **before comparing the already stored `reviewedRequestSha256` and `providerInputSha256` to the current reviewed source and payload**. Consequently a new prompt, remembered event/recollection, sourceSignals, owner intent, provider consent or review with a recycled requestId could receive an unrelated older story result. Also, the success path does not read/verify that the returned `storySessions/{sessionId}` still exists, belongs to the exact owner/request, remains ready and is not revoked. This is a source-level mismatch, not proof of live data exfiltration. The original story is a **creative derivative, not source evidence**, and its version should not be falsely attributed to changed memories.

## Isolated source remedy
New branch `review/chalk-storytime-generation-fingerprint-20261107` starts from exact #97; does not overwrite #83/#96/#97/#99/#100/#101/#102/main.

- New `functions/src/storytime-request-binding.ts` Git blob **235853e22439db21b9373ab2ffbc19a3856d3d04** with pure `sameStorytimeGenerationBinding` and `isReusableStorytimeSession`; rejects missing/invalid SHA-256 fingerprints, changed reviewed/payload identity and owner/request/status/revocation mismatch.
- Updated `functions/src/storytime.ts` Git blob **d9e7f64cc7b019d7e810cecbbffac9064ccf17cd**: computes expected reviewed and provider hashes before transaction; checks both stored hashes on every existing claim, including legacy incomplete claims (fail closed); on successful retries reads the referenced original Storytime session inside the *same Firestore transaction*, requiring current owner, original request, ready status and nonrevocation.
- New `tests/unit/storytime-request-binding.test.mjs` Git blob **e0bc235158d8eebfb4e59e436e6b7eb117cb2650**, five test cases: exact binding, changed review/provider input, malformed/missing fingerprints, session owner/request/revocation status, and callable source ordering.

## Execution evidence
Two files were reconstructed locally from **byte-identical connector source** and both matched GitHub's Git-object IDs:
- `storytime-request-binding.ts` SHA-256 **b9383f8bff1b02920ea90e4359ffd25d91f201a06a7cd11e39f3cb4d5dbd2745** (1293 bytes).
- `storytime-request-binding.test.mjs` SHA-256 **c06b51da2d128e1a931f3847008c594c693f1910a6d4e8fc1a9c7d6978faff65** (3215 bytes).

Node **22.16.0**, native `node --test --test-name-pattern='^(same immutable|same request ID|unverified|retry returns)'` executed **4/4 PASS**. This filters out the fifth source-integration assertion because full `storytime.ts` and Firebase project dependencies were not checked out into the local runner. The fifth test exists and was text-inspected against the GitHub source but **NOT EXECUTED**. No Firebase emulators, provider, real private memories, cloud storage or paid workloads were invoked. A full npm install/Next build is still blocked by DNS resolution for `github.com` and unresponsive Actions runners; this narrow test does not constitute production certification.

## Authority distinctions and compatibility
- A recycled requestId never authorizes a *different* source; revised wording, source-selection or consent requires a new explicit reviewed request.
- Historical claims without proper fingerprints now refuse existing-ID reuse. This is intentionally fail-closed and should be independently compatibility-reviewed before deployment. No rewrite of old private records is authorized.
- The transaction reads server-produced story metadata, but Firestore Rules currently allow client-modification of some canonical fields in the #97 base: prior source-level R900 PR #100 addresses that separately and is still unmerged.
- A successful idempotent reuse **does not independently revalidate current generation consent from canonical Privacy** or all source-specific owner/deletion rights. This remains a separate cross-system P0.
- A checked hash binds the submitted *input*, not proof that a real recorded memory is true; human recollection and AI narrative remain separately attributed.

## Required original-source acceptance
1. Frozen Node22 root+Functions builds with exact-head tests, full fifth source assertion, isolated Firebase real Auth/Firestore/Functions transaction tests and concurrent requests.
2. Positive exact owner+same reviewed content retry (one result); negative changed source, sourceSignals, consent, provider payload, wrong owner, revoked/removed original session, absent/malformed stored hash; check no second provider spend or duplicate story.
3. Exact emulators and native CI; don't promote while Actions fail before execution. Independent security review for Firestore Rules hardening (#100), account change (#101/#102) and source authorization.
4. No production/deployment/real owner media until canonical Privacy, Jobs and downstream deletion fences prove signed owner/purpose/source-specific authority.

**Decision: draft, test subset verified, integration not verified, PRODUCTION HOLD.**
