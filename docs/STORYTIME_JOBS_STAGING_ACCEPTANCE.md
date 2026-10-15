# UrAi Storytime to Jobs acceptance harness (Wave 31)

This is an executable, non-generative integration probe, not a deployment recipe.
Run: node scripts/storytime-jobs-staging-acceptance.mjs --mode=staging --phase=preflight

Phases:
- preflight: offline/no mutations; rejects production, shared, missing/placeholder project IDs.
- verify: real Firebase Auth sign-in and provider account lookup for two disposable identities, then confirms a foreign owner cannot inspect the preseeded voiceover job.
- exercise: only after explicit protected approval and operator-seeded, revoked synthetic fixture. Uses existing authenticated manageVoiceoverJob callable for owner status, playback-denial before/after deletion, terminal cancellation, Jobs delete-output, idempotent deletion retry, stale-status rejection and foreign delete denial.

For a dedicated Firebase staging project set URAI_STORYTIME_FIREBASE_PROJECT_ID,
URAI_STORYTIME_STAGING_TARGET, URAI_STORYTIME_APPROVED_STAGING_PROJECT_ID
and GOOGLE_CLOUD_PROJECT to the actual same provider-verified project ID.
Set URAI_STORYTIME_PRODUCTION_TARGET to its real distinct production ID.
Set STORYTIME_FIREBASE_ISOLATED=true and URAI_STORYTIME_ACCEPTANCE_STAGING_APPROVED=true
only after the protected staging owner has verified isolation and approval.
Set URAI_CORE_FIREBASE_PROJECT_ID and URAI_ANALYTICS_FIREBASE_PROJECT_ID.
STORYTIME_ACCEPTANCE_FIREBASE_WEB_API_KEY must come from the authorized
Firebase client configuration, not a pasted service-account credential.

The protected fixture is identified by STORYTIME_ACCEPTANCE_RUN_ID (wave31-...),
STORYTIME_ACCEPTANCE_SESSION_ID (wave31-... containing that run ID) and
STORYTIME_ACCEPTANCE_VOICEOVER_JOB_ID (voiceoverJob_<remote job ID>).
Use distinct urai-wave31-owner-... and urai-wave31-other-... test accounts
at reserved example domains and supply their PASSWORD environment values
through approved secret handling. The operator must preseed a real disposable
Storytime/Jobs binding; this runner never generates a job or private audio.

Only the exercise phase accepts STORYTIME_ACCEPTANCE_MUTATION_APPROVED=true
and STORYTIME_ACCEPTANCE_REVOKED_FIXTURE_APPROVED=true; those are operator
assertions, not independent consent-write or deployment verification.

For emulator preflight, use URAI_STORYTIME_FIREBASE_PROJECT_ID=demo-urai-storytime,
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 and
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 with mode=emulator.
Emulator verify/exercise also require running Functions emulator and a
preseeded disposable job. Do not report emulator receipts as cloud acceptance.

No production scheduler, paid provider call, media dispatch, service deployment,
or other account's data is touched. The runner never prints passwords, tokens,
raw UIDs or bridge secrets. Only hashed project/run identifiers and check names
appear in successful evidence.

Acceptance limitations: authenticated service response is not independent
GCS object-generation deletion proof, nor evidence of the original consent-write,
actual Cloud Run deployed revision, verified recovery lease, provider output
generation, full cleanup, cross-repository WIF, or Gold Master launch.
The operator must perform governed cleanup separately and retain its receipts.

## Evidence-integrity safeguard (Wave 35)

Direct Node CLI runs use the native network transport when testing a real approved staging environment. Programmatic tests that inject a fetch transport **always** yield `transport: synthetic` and `SYNTHETIC_*` classifications, even when their configured `mode` is `staging`. Offline preflight reports `transport: offline` and never claims authenticated staging. Only successful native-network staging identity/tenant checks set `authenticatedStagingVerified: true`; all code paths retain `remoteCloudDeletionIndependentlyVerified: false`. These are classification guarantees, not independent deployed-service acceptance.
