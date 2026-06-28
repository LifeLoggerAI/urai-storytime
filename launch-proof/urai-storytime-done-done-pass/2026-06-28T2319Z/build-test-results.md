# Build and test results

Timestamp: 2026-06-28T2319Z

## Result summary

Status: NOT LOCALLY VERIFIED

Reason: The execution container could not resolve `github.com`, so the repo could not be cloned for local dependency install/build/test execution.

## What changed to support tests

The smoke/unit tests were updated to cover the new production wiring truth:

- `/storytime` has both cloud callable and demo fallback paths.
- `/storytime/[sessionId]` no longer statically blocks real ids and routes non-demo ids to `CloudSession`.
- `CloudSession` has signed-out, blocked, not-found, error, and ready states.
- `/share/story/[shareId]` no longer statically blocks real ids and routes non-demo ids to `ShareStory`.
- `ShareStory` has blocked, loading, not-found, revoked, expired, error, and ready states.
- Runtime config now gates cloud mode, public sharing, Firebase client config, and provider readiness.
- Functions provider generation wiring is covered by smoke assertions.
- Env template validation now covers public client gates and provider model config.

## GitHub Actions

Checked workflow runs for latest code/test commit before proof docs: `efaf6c752a5709ac346a5336ce536acefafc2af8`.

Result: `workflow_runs: []`.

## Required before production-ready verdict

Run and capture passing output for:

```text
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm --prefix functions install
npm --prefix functions run build
firebase emulators:exec --only firestore,storage "npm test"
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

The above are required before claiming PRODUCTION READY or LIVE.
