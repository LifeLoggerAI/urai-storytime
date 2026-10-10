# UrAi Storytime current private-session source repair — 2026-10-10 UTC

Base/controller: existing open draft Storytime #83, `repair/dependency-advisories-20261007` at `422d1e6cf9ecf34da6fc2095018c73984e44a754` / tree `51127da2eb883372e19d4c2d25a90a9d0d1e3c67`. Main remains `73f586a0a2931961ae221af7cfc0caf1b6aef39d`. No AGENTS.md exists in the checked-out repository. Adopted `docs/ARCHITECTURE.md`, immutable initial-version producer and `functions/src/story-versioning.ts` remain authoritative.

## Defect and correction

The mounted CloudSession child queries supplied sessionId without owner identity; actual unchanged Firestore Rules deny those queries for an ordinary owner. They now supply both selected session and current owner, with four matching source indexes. Rules are unchanged.

The editor used the first narrator/moment returned by unrelated query ordering, and its scene card used the first scene. Current immutable version IDs plus existing chapter/moment/narrator/scene links now select the actual records. Missing, foreign, contradictory or mixed-version records remain unavailable; retired neighbors never replace them. Document IDs come from the SDK snapshot. The existing immutable versioning and provider-free editing paths are unchanged. Extra chapters absent from the session chapterIds are not admitted to playback/timeline.

The async Auth callback previously accepted late prior-account reads and could display a prior route until its effect ran. Each load now pins the callback epoch and exact current Firebase User object, clears prior data at the new callback, checks current authority around awaited private reads, rereads the parent before admitting the bundle, and hides stale route/account pixels during rendering. A version change remounts editor state. No provider, voiceover, public-sharing or production flag is enabled.

## Executed evidence

- Frozen root npm graph installed without lock change; Node24.19.0, TypeScript5.9.3, Next15.5.27. Predecessor unchanged root suite:410 PASS. Current root suite:432 PASS /0FAIL /0SKIP, including22 actual mounted-component source cases with explicitly controlled SDK/Auth/React adapters. Exact predecessor source fails21 of those22 cases. This is supplemental source execution, not a browser or protected cloud receipt.
- Root typecheck and production Next build:PASS. Functions compiled on declared Node22.23.3 with the frozen Functions graph:PASS. Existing backend, protected delivery, provider/privacy controls and locks are untouched.
- Actual native Firestore1.22.0 and Storage rules-runtime1.1.3 via Firebase CLI15.32.1 / Temurin21.0.12.1+1 / Node24.19.0 / rules SDK5.0.1 / Firebase12.13.0:22 PASS /0FAIL /0SKIP (15 retained authorization/public-share cases plus7 actual-query cases). The actual CloudSession loader executes real Firebase client queries through the real unchanged Rules; other callbacks remain controlled. Predecessor loader:6PASS /1FAIL, its ordinary-owner bundle load denied by the real Rules. Current loader admits only owner/session records; session-only predecessor queries and foreign/signed-out callers remain denied. Emulators shut down cleanly.
- The existing native authorization workflow now runs the added seven cases and watches changed loader/selection/index source. Its declared Node22.23.1/CLI15.23.0 hosted execution remains a separate fresh exact-PR-head gate. Local Node24/CLI15.32.1 results do not impersonate that workflow.

These tests operated only on synthetic emulator records. No private family source, provider credential, provider request, paid generation, deployment, account activation, independent review or release acceptance occurred. Protected cloud/live/browser/device acceptance, authentic film/source/voice/provenance, deployment parity, paid-worker configuration and independent review remain open. Generator derivative/immutable-version admission and other private-library callbacks are outside this bounded mounted-session repair.

## Validated source bytes

| File | SHA-256 |
| --- | --- |
| `src/components/storytime/CloudSession.tsx` | `5467835d677eea556dc469eda30aa9b5509e4d7a1f59b0b492e98af69c798a56` |
| `src/lib/storytime/current-session-records.ts` | `7cce72a2d75c302a87089110be39ed150745418bedb198942c2be9f37b4be939` |
| `firestore.indexes.json` | `5beef9bbd74a3bd9db68c54b0ba230cd9fc9c6fd54d375b3a146db7e6bcf81b7` |
| `.github/workflows/public-share-rules-emulator.yml` | `8265d094dc4fc513203958a0e0968c71d17ccfd906007511d29b1e7875f106f9` |
| `tests/unit/cloud-session-current-source.test.mjs` | `0f56ee2496d51c5c1b46642c2f5839f8880466737dafa574aef89a9f48aeeb60` |
| `tests/rules-emulator/cloud-session-queries.test.mjs` | `cde5abc4276c2d4119a618e71962408963f3ef77ce329f9fc46c7398a32477b2` |

## Original local log fixity

Logs were retained under the execution evidence directory; these hashes bind the original output and do not claim a remote CI artifact. The repaired source was tested as the exact six-file delta above on the stated parent, before this evidence-only note was added.

| Log | SHA-256 |
| --- | --- |
| `storytime-predecessor-suite.log` | `133e06ef713f2e716f229a4cfbba4614a4527b67e8cb3ad902a1d0b57302ec1c` |
| `storytime-cloud-predecessor.log` | `7a798ac022c4e4853c354887ee4e1a11f97f51395076321adfa7d7bce8979a95` |
| `storytime-cloud-repaired.log` | `158db1564234ff67de7ce953fe68af551b9ccdae9ebc84ad03ed600143ec3bbd` |
| `storytime-repaired-suite.log` | `348b163cbee71cf8fcc3b3b04444bd967e87ddd0ac8c618015ddcc60182ed33f` |
| `storytime-typecheck.log` | `f0314d9fd76eba25f93051efda6a77d25383cfc3338111b5d2cf87aa8fc325bf` |
| `storytime-build.log` | `949341d1328c710f49274524337681ab3b2ef93e94ddb490ee40f86754b63d40` |
| `storytime-functions-build.log` | `7125f194612fcff2f454c05d848e7cb71facc1967b4d5017e25b34fdee3ba74f` |
| `storytime-native-predecessor.log` | `62d9c71fc9c739f7524c3898eea726915ef68f6f03fc212b823a2258c5fda83e` |
| `storytime-native-current.log` | `204f9494bb229c33288c70a76713b61cf01971fe130aa4e7be444ecc6d2e62d8` |
| `storytime-native-emulators.log` | `baaa5364610c87c08ed84c5452279934db63b9c4d6a4526a27aa9798799de255` |
