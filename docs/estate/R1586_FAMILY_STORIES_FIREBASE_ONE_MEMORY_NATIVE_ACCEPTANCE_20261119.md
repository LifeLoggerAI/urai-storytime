# R1586+ Family Stories — verified Firebase one-memory access and private-media denial (2026-11-19)
Status: **REVIEW ONLY / PRODUCTION HOLD / NO-GO**. Private-memory writes OFF.

## Exact source
Repository `LifeLoggerAI/urai-storytime`, existing [PR #117](https://github.com/LifeLoggerAI/urai-storytime/pull/117) on `review/r1586-family-story-named-grant-policy-hold-20261119`.
Current tested exact HEAD **`87634b8aa9d512f649c83e3115a1f47244d7d295`**, Git tree **`6620c48e4ea13b0125b2a889d84c32b1bd5f0550`**.
Source ancestor [Storytime #116](https://github.com/LifeLoggerAI/urai-storytime/pull/116) `edd21fb1823621eadcd9631f3b89816394332de6`. No main merge, staging/production deployment or owner private data mutation.

## Implemented
- `src/lib/storytime/family-story-access.ts`: pure fail-closed named-recipient, purpose-scoped, revision/epoch/expiry predicate (36 original synthetic checks).
- `functions/src/family-story-sharing.ts`: existing Firebase Functions v2 callable boundary `grantFamilyStoryView`, `getFamilyStoryView`, `revokeFamilyStoryView`, integrated with current Storytime owner verification (`verifyIdToken(token,true)` + `getUser(uid)` + second token verification). Grant requires verified owner and recipient, session current source, active consent snapshot, exact recipient/version/epoch and *previously server-created* `storytime.family_share` Privacy consent receipt. View only returns a narrow `title`, single `chapter.summary` and classification, not raw source, recording, image, history or storage path. Revoke transaction advances share epoch and disables prior grants.
- `functions/src/index.ts`: exports guarded callables. Gate `STORYTIME_FAMILY_SHARING_ENABLED` is **false/absent by default**; *not certified to enable*.
- `firestore.rules`: no direct client authority to read/write grant, epoch or consent-receipt collections; underlying `storySessions` and generated records remain owner-only.
- `storage.rules`: explicitly deny direct client read/write to legacy `families/{familyId}/stories/{storyId}/{fileName}` and exports. This intentionally removes previously broader family-claim access, which requires app compatibility review before any merge.
- `tests/rules-emulator/family-private-sharing.test.mjs`: synthetic Grandma, Mom, outsider and admin Firestore/Storage direct access denies; original 24 rules cases updated to expect strict storage denial, not family-claim writes.
- `tests/rules-emulator/family-auth-callable-emulator.test.mjs`: actual Firebase Auth emulator ID tokens, verified users, functions `.run` with real decoded/revoked-check identity, Firestore emulator transactions and two separate story sessions.

## Real existing Runpod execution
Worker: existing authorized Pod **`vxmo8gjblvsvxg`**. Node **22.23.5** and reused Java **21.0.13.1** JRE. Disposable Firebase project **`demo-urai-family-r1586`** only. Tests used synthetic emails and fixtures. No production project, token, service account, media, GCS or external provider.

| Exact-head check | Result | SHA256 of original local log |
| --- | --- | --- |
| `npm run typecheck` | **PASS exit 0** | `fd099a115a850bbf7f507245c53516be3710c4ba0e69ac48bc227fbd9e9f0503` |
| `npm --prefix functions run build` | **PASS exit 0** | `c15a93f1cee1b0c82e92a3d8300c940c20bb7764b99b75dc452557925798facb` |
| `node --test tests/unit/family-story-access.test.mjs` | **36/36 PASS exit 0** | `1c12621fd661d35637b88cd5a64806ee044932db14b32ed9a8a73018cac0f7be` |
| `firebase emulators:exec` Auth + Firestore + Storage; synthetic actual callable test | **1/1 PASS exit 0** | `b5b5af765814e9ac13303bc356b9f919195407801ae8145f58380f64e038b1df` |
| `firebase emulators:exec` full `tests/rules-emulator/*.test.mjs` with `--test-concurrency=1` | **26/26 PASS exit 0** | `d84a7cbee25c419fd0b13626f30eec83ea3e6a1fa041657bbb41edc58be41707` |
| First 2-case dedicated Firestore/Storage denial test (prior candidate) | **2/2 PASS exit 0** | `5ecd76f82b7202eb71d47717c33b13f8ba9253faaf50b72d901d1f449778a037` |

**Exact callable test observations:** synthetic owner Grandma signs in via Firebase Auth emulator; second synthetic verified account Mom signs in; outsider signs in. Preseeded *test-only* canonical-looking receipt allows Grandma to grant one exact session to Mom. Mom reads one named summary only; she cannot read sibling story or ungranted media; outsider rejected; unauthorized grant refused; revoking source receipt blocks; restoring test receipt re-allows; named grant revocation blocks; old receipt cannot reactivate. The signed Firebase tokens are actual emulator-issued tokens, not production identities. The preseeded consent receipt is a deliberate **emulator fake, NOT an independently issued canonical Privacy authorization**.

First all-file parallel rules attempt **23/26 PASS, 3 FAIL** from concurrent `clearFirestore` fixture interference; tests re-executed sequentially against a fresh emulator yielding the 26/26 receipt. Other preflight nonpasses: default Java 17 rejected by Firebase Tools 15; original local `firebase.json` tried disabled framework emulation; auth fixture initially rejected Firebase CLI's injected `FIREBASE_CONFIG`. All failures preserved and corrected by test-only local runtime config and the source-published strict localhost-only guard. No runtime security exception was introduced.

The earlier full Storytime root unit/e2e suite at PR #117 first candidate was **616/654 PASS, 38 FAIL**, compared with exact parent **580/618 PASS, 38 FAIL** with all 38 failing test names identical. **This is not full-suite certification**; independent CI and regression triage remain required.

## Important boundary: source policy is not yet a production security authority
- `storytime.family_share` / `family-story-share-v1` is proposed, not registered or accepted by canonical URAI Privacy. `issuedBy: urai-privacy` marker alone is not a signed trust mechanism or proof of current upstream purpose/consent state. Grant reads must use a truly authenticated, writer-restricted canonical receipt lineage and listen to owner-wide revocation before enabling the feature.
- Sharing writes remain **OFF** by environment gate; no public/mobile sharing UI, hosted Firebase sign-in, signed real source media, or production IAM exists for this feature.
- All direct private media client reads are denied. Neither recipient photo/audio delivery nor copy/invalidation/cache reclamation is implemented. Legacy `/stories` / `/storyRuns` family-role reads must separately undergo domain-boundary review before any family content pilot.
- Existing [Storytime #116](https://github.com/LifeLoggerAI/urai-storytime/pull/116) source audit identifies Jobs narrator `deleteOutput` generation-mismatch race (no `ifGenerationMatch`), not an observed live exploit. Storytime narrator text is distinct from secure TTS audio. Canonical Privacy `storytime.voiceover` purpose, Jobs private `deliver` bridge, owner/consent/revocation checks and generation-bound delete/backup/retention remain uncertified for real family recordings.
- Existing Vercel `urai-genesis-private-app-review-r1193` has a READY *different* staging deployment `dpl_3h9p8zrreTa7xVMmgfe41dcmWxba`; **it is not Storytime #117 source and does not demonstrate this workflow**. No new Vercel/Firebase deployment attempted.
- Upstream broader Genesis independent reviews, live GCS IAM exclusive writer, upload drain, stale-writer denial, CI and release gates remain OPEN.

**Next bounded engineering:** Register canonical Privacy purpose with reviewed issuer and current-revocation semantics; converge approved authenticated source receipt/epoch; run an actual cross-repository source-bound native test of grant + revoke + deletion and recipient audio/image denial; investigate existing broad legacy /stories paths, device/hosted auth, and narrator generation-matched delete with g1→g2 interleaving; only then test same-SHA protected staging and request independent approval. Production HOLD / NO-GO, private-memory writes OFF.
