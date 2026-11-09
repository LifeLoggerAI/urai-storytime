# R910 — Storytime uncertain-generation request identity and truthful completion receipt

**2026-11-08 Central / 2026-11-09 UTC — isolated engineering review only; PRODUCTION HOLD.** This work starts from exact [R909 PR #107](https://github.com/LifeLoggerAI/urai-storytime/pull/107) head f2614267fde4da8d71be9b124d495dedafdcdc97. No owner or other worker branch, main, Firebase, provider, private memory, billing, or deployment changed.

## Confirmed source defect and risk

StorytimeHome previously used a newly created request ID on every form submit. On any callable error it stated that no private story was saved and directed the user to try again. A lost network response cannot prove no story was committed and cannot prove no provider charge. Another submit then minted a different request ID, bypassing server same-ID idempotency and risking another legitimate provider invocation. This is **source-level risk**, not proven duplicate charges, production exploitation, or original-memory access.

The existing backend generation claim already binds an existing request ID to exact reviewed input and provider-input SHA256; an approved, ready, same-owner session may be safely reused, and processing/failed/held/needs_review/cancelled/unknown states fail closed. A *new* request ID can still start new work.

## Safe isolated correction

- Added src/lib/storytime/generation-attempt.ts, a pure helper retaining an actor-object-bound, reviewed-fingerprint-bound original request ID in one mounted page. Refuses absent actor/fingerprint or malformed IDs.
- StorytimeHome now saves the attempt in a ref, sends its exact request ID to the callable, and clears the actor-bound in-memory attempt on Firebase auth change or component unmount.
- If callable completion is uncertain, generationOutcomeUnknown disables the next form submission and the submit button in the mounted page. It states that generation **may already have been saved or may still be processing**, and directs the user to the private story library and explicit reconciliation rather than asserting no save and automatically initiating another paid attempt.
- This deliberately conservative guard can also temporarily block requests which actually failed harmlessly until reconciliation. It is safer than claiming a failed transport proves no committed server output.
- No server request model, provider transport, consent, source labels, user data or generated-story record was changed. The existing source-truth fixes remain.

**Limitation:** A mounted React ref is NOT durable across browser refresh, sign-out, another browser/device or recreated session. Current owner/server-authoritative request status and safe recovery are still P0. The local form safeguard must not be represented as complete global anti-duplicate-spend protection.

## Exact source evidence and verification

- New helper src/lib/storytime/generation-attempt.ts — Git blob SHA-1 3f49841af2ea89d03358a53ac349b579a1f5ae0b; 1,272 source bytes; independently computed raw SHA256 9a86ad10f06b4e209b5ad2fdfa689d47d918beca4039e975deae9b7f72379316.
- Modified StorytimeHome.tsx — Git blob SHA-1 de36f619c590f00e390c111ab521442cc8c97de8; 27,381 source bytes, prior R909 donor 4c65137273ec09f39bfffe520bc5cc9018f08bc8.
- Original-source regression suite tests/unit/storytime-generation-attempt.test.mjs — Git blob SHA-1 dcd622d91f88ac06ff3ec4dea2e6a72b85b1a934; seven cases authored but not executed as a full project suite.
- Backend functions/src/storytime.ts unchanged — Git blob SHA-1 809154cc65156e54e209292e8df87bdbd1074803.
- **8/8 native Node v22.16.0 isolated helper tests PASS** against exact Git blob-verified helper bytes: first ID, same-reviewed-input reuse, new reviewed source, same UID/new User, other UID, absent actor/review, malformed ID, no duplicate allocator.
- **18/18 static integrated source control-flow readback checks PASS** on the actual GitHub repository branch: locks unknown outcome, carries request ID, denies accidental new inline ID, clears on auth change/unmount, has backend status guards and appropriate source tests.
- Local full project test attempt was blocked by lack of mounted original Next/Functions working tree; git clone/ls-remote failed DNS (Could not resolve host: github.com). The first isolated test harness also needed separation from the missing React file; final successful 8/8 test runs only against the helper. **No full npm ci/tsc/build, complete Node suite, Firebase four-service emulator, React browser, paid provider call, signed Privacy consent, real memories, production or deployment acceptance.**

## P0 continuation

1. Freshly verify R910 PR head and all GitHub Actions runs and job steps; older R909 had failing workflows with zero steps and empty runner name. Diagnose runner startup instead of attributing unseen failure to product code.
2. In an authorized full checkout, run exact-head frozen root/Functions install, TypeScript/Next/Functions builds, all original tests including this seven-case suite, and the four-service Auth/Firestore/Functions/Storage emulator owner/other/administrator matrix. Test transport loss after server commit, duplicated submit, processing and held-charge statuses, source/consent change, late cancel, and signed current-owner recovery.
3. Design and verify **durable server-owned generation-status recovery**, matching request ID, original reviewed input and owner/consent across reload and devices; prohibit another spend admission while a prior charge or result remains ambiguous. Preserve UI accessibility and user correction/immutable story versions.
4. Keep original-source rights, per-claim truth classes, child/third-party consents, downstream Jobs protected output, Spatial Replay, revocation/deletion, and Firebase deployment identity as separate production gates.

**Remembered testimony != recorded source != AI interpretation. Production HOLD.**
