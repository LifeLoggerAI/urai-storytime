# Storytime 05 — Exact-source CI and testing evidence

Review-only source forensic reconciliation. main@73f586a0a2931961ae221af7cfc0caf1b6aef39d; unmerged PR #97@312240f5da9042a2cc9d11dac179bed90dee51d1. November 7, 2026. Production HOLD. No private user media inspected.


## Immutable acceptance snapshots

| SHA / PR | Evidence | Result and scope |
|---|---|---|
| 0ea33e1049b122db9bdfc518032cb2c84777d267, #24 | July Drive URAI-100 receipt, Verify 29351958213, CI 29351957424 | Historical 58/58 source, 16/16 smoke, app/Functions build. Not Firebase behavioral/provider/production proof. |
| 33ecc480ffe96e83647a29e09969defeb84ca3fd, open #83 | Owner PR and historical branch receipts | Prior head source/emulator checks, not automatically current exact-head GO. |
| 31cf72a01b65667de89c9ad565b6f0a4e51759a0, open #96 | Verify 38685224444, CI 38685224348, Visual 38685224333 | All three SUCCESS Oct 15, 2026. CI includes real disposable Auth/Firestore/Functions job success. Synthetic fixture staging; not production user/consent or provider proof. |
| 312240f5da9042a2cc9d11dac179bed90dee51d1, open #97 | Verify 42161497313, CI 42161497176, Visual 42161497154 | All three FAILURE Nov 6; native integration and production-only jobs skipped. PR body separately reports 36/36 local Node deployment-guard checks. |
| a0fa8fc773a768de10cdb8b33386f3ce22282d15, open #98 | Verify 42339933016, CI 42339932962, Visual 42339933014 | All three FAILURE Nov 7; production-only skipped. |

GitHub CI job-log retrieval for latest red #97/#98 runs returned 404 BlobNotFound, so the actual failure cause is UNKNOWN. The Oct 15 #96 root CI original job log (ID 116258420712) was accessible; it records an exact clean checkout, successful test/build steps and retained app artifact 11949439534 with SHA-256 digest 06cd694823a7e52956756b668e8c2a8d1863192751d69ffbad2a0f6bb03663aa. CI's native disposable emulator job 116258420843 and Functions build job 116258420861 also completed successfully.

## Current source-test semantics

At main, package.json runs unit and e2e source Node tests, while emulators:test starts emulators but executes security scaffolding/runtime/spec validators; it does not itself run the full behavioral tests/rules-emulator suite. #96 contains a separate native real-emulator acceptance workflow. No source tests, frozen npm installs, Next build, or Firebase emulator were newly run by this investigation: container network DNS prevented a fresh clone.

Need next: fetch failed-job logs through permitted alternate route, exact-source frozen install and full native tests at final review SHA, authenticated owner/non-owner negative emulator matrix, real protected browser memory flow, cancellation/revocation/deletion races, CI artifact download/digest, deployed target identity/source readback, accessibility/device acceptance and independent release sign-off. Historic success is never transferred to a moved head.
