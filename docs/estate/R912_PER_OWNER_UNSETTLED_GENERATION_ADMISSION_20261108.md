# ONE URAI GENESIS — R912 per-user Storytime generation admission / unsettled-spend fence

**Review only; production HOLD.** November 8, 2026 America/Chicago. Exact parent [Storytime PR #109](https://github.com/LifeLoggerAI/urai-storytime/pull/109) at a11f35708bb81ae1cedfc36175af0595ac62874a. This independent child branch changes no prior worker, main, live Firebase, private user records, billing account or provider. The new source is intentionally fail-closed; it does NOT certify production safe generation.

## 1. Observed gap — original sources

Original functions/src/storytime.ts claimGenerationRequest(userId,input) performed a transaction against one storyGenerationRequests document keyed by UID+requestId. It prevents reuse of the **same ID** with changed reviewed/source/provider hashes, rejects already-processing and held states, and validates the original owner/session for succeeded reuse. However, a second tab or device could create a different requestId and therefore an independent generation claim; the existing quota and provider budget counters did not prevent a distinct concurrent request in all circumstances. R910 added a mounted-page retry hold and R911 a read-only owner recovery list, but neither enforced cross-device single unresolved request.

Provider flow can hold funds for uncertain dispatch/recording, output moderation, lost persistence acknowledgement, cancellation after provider observation and long-lived reconciliation. Simply releasing a lock on status=succeeded or on an apparent failed request would falsely equate story state with provider settlement. The existing spend gateway keeps chargesReconciled=false/retryAuthorized=false until separate accounting. Do not bypass.

## 2. Focused R912 patch and exact Git blobs

- functions/src/story-generation-admission.ts, Git blob **01079313fd93d6340364aed9cd3ace86b52c51a5**, 2,020 raw bytes, independently verified Git hash-object and SHA256 **4a5499979f01ce30725d2ff1cad5db3010890bbc330e7c932830af3b28944e0c**. Pure guards:
  - isClearedStorytimeAdmissionGuard demands exact UID, v1 schema, state ready, activeRequestId=null, legacyRequestsReconciled=true, providerChargesReconciled=true and a syntactically valid lowercase SHA256 clearanceReceiptSha256;
  - heldStorytimeAdmissionRecord binds UID, requestId, exact reviewed and provider-input SHA256, timestamp; overwrites prior clearance flags with false/null and state=held.
- functions/src/storytime.ts, Git blob **95716cf1beb2f2382657f5c5934ad4a516e3a133**. New request claim transaction reads existing per-ID record **first**. Existing same-ID success reuse/denial branches remain. For a brand-new ID, reads db.collection("storytimeGenerationAdmissionGuards").doc(userId) **inside the same transaction**, rejects missing/legacy/uncleared records, writes a held owner guard and the new processing request claim in that same transaction. Competing cross-device writes conflict on the same document and require transaction re-evaluation; only one can consume a given ready clearance.
- firestore.rules, Git blob **afb4ed09243a81b15d3614f8cd1fcc70d33b481e**, adds an explicit match denying all client reads and writes to storytimeGenerationAdmissionGuards; original storyGenerationRequests continues deny all client access.
- tests/unit/storytime-generation-admission.test.mjs, Git blob **a1174e34cb75e05030443a0c611a6a593c54bb00**, nine exact-repo test cases authored covering default deny, owner identity, legacy/charge receipts, held state, malformed IDs, one atomic transaction, existing request reuse semantics, client Rules denial and absence of auto-unlock.

No new client-mutable authorization, no automatic paid retry, no unlock endpoint, no source/recollection/AI fact promotion, no Jobs provider transport change, no private media, and no real production resource changes.

## 3. Critical hold-first migration behavior

**There is deliberately NO code that creates a ready clearance and NO code that unlocks held requests.** A missing guard rejects every new request, including a new user's first story. This is intentional because existing accounts may have unsettled historical requests. New account provisioning and legacy-account migration require separately authorized, audited verification that existing provider charges, generation claim states, account rights, cancellation and deletion holds were reviewed. Do not fabricate a clearanceReceiptSha256 or turn legacyRequestsReconciled/providerChargesReconciled=true on request or from a simple status lookup.

The current R912 branch therefore MUST NOT be deployed as though it completes an available public generation product. It is a candidate safety gate awaiting lawful, auditable clearance issuance and settlement workflow plus successful real-emulator acceptance. Until then, it conservatively blocks all new generation. The code's SHA256 receipt validation is *syntax only*; the issuer's signature, scope, epoch/expiry and trusted source evidence are NOT independently cryptographically validated by this helper. That gap is P0 and must not be glossed over.

Even a completed story may leave the guard held while provider reconciliation is pending. A late failure, moderation needs_review, cancellation or cloud unavailability never automatically releases it. Same-ID verified historical ready read is allowed without another provider dispatch, but must not be mistaken for consent to generate new output.

## 4. Test evidence — exact qualifications

Fresh local runtime: Node v22.16.0; Git v2.47.3. git clone/ls-remote to github.com again returned DNS failure. Locally reconstructed original 2,020-byte helper **exactly** (git hash-object matches GitHub blob SHA 01079313fd93d6340364aed9cd3ace86b52c51a5). Native node --test of local independently authored six-case isolated helper suite: **6/6 PASS**. Log SHA256 **2b308cb47ad2645a7b5a880a5aec324c3480a5be6d89cc6a4a209cbee51bc4ad**, test file SHA256 **f0c7c4996f43cbfdb3010f67d118d1787e2053394e01da98a6d48dd23b29de30**. These files remain local evidence; they are not the nine-case repo suite.

Connected GitHub direct source readback: **17/17 static contract invariants PASS** across the four files. The new nine-case original-repository source-contract suite is committed **but NOT RUN**. No complete original Git checkout, npm ci, TypeScript/Functions/Next build, real Auth/Firestore/Functions/Storage emulator, actual concurrent transaction/cancellation test, browser/device, paid provider gateway, canonical Privacy grant, Jobs protected Replay, original private-memory data, IAM review, independent reviewer approval or production release acceptance was performed.

Older PR #109 exact-head Actions CI/Verify/Rules/Visual completed failure with empty runner names and zero job steps; these are GitHub job statuses, not evidence original tests ran. R912 must obtain its own fresh exact-head workflow/job readback; no inherited green. Recheck the current heads of PRs #97–#109 before integration.

## 5. Required end-to-end negative/positive acceptance before any GO

P0:
1. **Prove real transaction serialization** under a native Firestore emulator: two simultaneous fresh IDs for one owner from separate Auth sessions, one successful claim and one rejected; different owners independent; same ID source mismatch and legitimate success reuse; simulated contention/retries; lost acknowledgement.
2. **Prove migration/clearance**: run authorized inventory of every historical per-owner storyGenerationRequests and provider budget reservation/dead-letter/receipt, including older than R911's 12-item UI list; verify actual no pending provider charges; trusted signed clearance issuer, owner/actor scope, expiry/revocation and version; no client shortcut; perform controlled dry-run and rollback test.
3. **Prove no early unlocking** after quota failure, provider reserve timeout, charge observation, successful story persistence with unreconciled spend, needs_review, cancellation, deletion or uncertain output. Release only with independent accounting, rights and source validation.
4. **Validate untrusted actors**: direct Firestore read/write access to guard/request denied for owner, other owner, admin-token clients and signed-out clients; privileged backend authorization/least-privilege IAM separately.
5. **Actual current original-source tests/build**: frozen root and Functions dependencies, Node versions and lockfiles, TypeScript, React, complete unit/e2e and Rules suite, authenticated browser with real two-account async races and accessibility; protected CI reviewer.
6. **Cross-service user truth**: original recorded source != human recollection != AI interpretation; signed source-specific Privacy consent and its current revocation; private Jobs voice and Spatial Replay only after downstream rights proof; actual provider media purge/deletion and backup acknowledgements.

P1: owner-friendly remaining-hold explanation, bounded receipt/status view including legacy outside recent 12, audit history without story text or raw labels, documented honest retry and correction semantics.

P2: device, captions, reduced-motion, guardian/third-party likeness/child legal scope and localization.

P3: raw byte coverage beyond selected helpers, all historical branch snapshots/assets, provider logs and real deployment provenance.

## 6. Next-Chalk exact handoff

Start at this R912 review branch/PR and its exact current SHA; open R911 PR #109, R910 #108, R909 #107, R908 #106, original forensic #99 and Labs master #262. Refresh all PR heads and current CI before modifying source. First get an actual runner and disposable Firebase emulator to execute transaction contention against synthetic owners. Build a separately governed release/clearance process—do NOT create arbitrary clearance records just to turn generation on. Review backend's entire provider-spend receipt and cancellation/deletion paths. Maintain production HOLD until independent signed ownership, source, provider reconciliation and protected E2E evidence exists.
