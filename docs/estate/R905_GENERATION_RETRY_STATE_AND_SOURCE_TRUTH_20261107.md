# R905 — fail-closed Storytime retry states and source integrity

**Exact source:** review branch `review/chalk-storytime-generation-fingerprint-20261107`, child of engineering PR #97 `312240f5da9042a2cc9d11dac179bed90dee51d1` and continuation of PR #103. **Production HOLD.** November 7 CST / November 8 UTC 2026.

## New source-level issue
The prior `claimGenerationRequest` checked a small subset of statuses and then fell through to `transaction.set(status=processing)` for all other existing records. An existing `needs_review` record after generated provider output safety moderation, an existing `failed` record, a malformed `succeeded` record without a valid story ID, and unrecognized legacy statuses could therefore enter a second processing attempt with the **same requestId**. This risks duplicate provider processing, circumventing the exact output review lifecycle, ambiguous charge reconciliation and incorrectly linked stories. It is a source-level risk, **not a claim of production exploitation**. An existing `succeeded` claim with `cancellationRequested=true` was previously prioritized for reuse; that priority has been reversed to deny cancellation first.

## Isolated changes

- `functions/src/storytime.ts` Git blob **131efb11f6bdcf5f1e9fe60bb5bcef6b0e33cdb4** now checks original source and provider hashes, then cancellation status *before* any result reuse. A `succeeded` claim requires a bounded syntactically valid session ID; a Firestore transaction must verify original `storySessions` owner UID, original requestId, status `ready`, `safetyStatus=approved`, same processed reviewed-source SHA-256, nonrevocation and `factualStatus=creative_derivative_not_source_evidence`. Every other preexisting state fails closed rather than falling through to a new provider attempt. A truly new request ID can still enter initial processing.
- `functions/src/storytime-request-binding.ts` Git blob **ce28459340e271c108756248ae46ec95df6e3be6** adds immutable session evidence/approved-only guards and bounded ID validator. Existing reviewed/input fingerprint matching remains.
- `tests/unit/storytime-request-binding.test.mjs` Git blob **87e2e7e610f5e0b0071c20ec6a1cbf624f215cde** covers changed source/provider hashes, missing/malformed historical evidence, wrong owner/request, unapproved or revoked output, falsely reclassified source truth, invalid IDs and callable control-flow guards.

## Authentic executable verification

An exact two-file UTF-8 source copy was created locally and each exact Git blob SHA-1 was verified against the latest GitHub readback (not just path names). On Node **v22.16.0**, the first **5/5 native helper tests passed** using `node --test --test-name-pattern='^(same immutable|same request ID|unverified|retry returns|missing or malformed)'`. These selected tests are small real Node tests with synthetic data, not Firebase integration.

- Helper raw SHA-256 `8a235f716ac1b13dc6ad435462d76ff22e73da563c35807ce4064df7d7e5a867`.
- Test raw SHA-256 `f5d1af69508d6d357e057ceeaa44239cb24f6a59231101a712915d6572da5cec`.
- The sixth test inspects the complete `functions/src/storytime.ts` callable and was **not** run in Node because the complete upstream project could not be cloned. Instead, **12/12 static source readback assertions** passed against its exact GitHub Git blob, including status and cancellation order, transaction read, original SHA binding and creative-derivative truth label. Static readback is not an executed emulator case.

## Unverified P0 conditions

- Full frozen checkout, npm install, typecheck, Next/Functions builds, actual Firebase transaction auth and concurrent retry acceptance, provider spend, protected Storytime-Jobs/Studio/Replay and physical deletion/revocation remain unverified. GitHub Actions at the draft head still fail before usable job steps, and container DNS cannot resolve github.com.
- Existing earlier `failed`, `needs_review`, malformed and unknown states now deny reuse; **intentional fail-closed behavior** requires owner-experience compatibility review, admin reconciliation and safe new-ID initiation rather than silent re-execution. The patch does not claim to clear held charges or restore old media.
- Downstream source authority and canonical Privacy signed consent/rights issuer not verified. Original recordings, attributed family recollections, AI interpretations and user edits must retain separate provenance and permissions.
- All other concurrent worker branches preserved. No production change, paid generation, real owner memory, consent mutation or merge performed.

**Disposition: PR #103 draft, safe source repair, limited original-source Node verification 5/5 and static control-flow 12/12, production HOLD.**
