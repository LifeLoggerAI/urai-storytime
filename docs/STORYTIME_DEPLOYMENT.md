# URAI Storytime Deployment

URAI Storytime is a Next.js + Firebase system whose cloud activation remains protected and fail closed until provider, legal, privacy, child-safety, rights/consent, monitoring, recovery, and rollback gates are evidenced.

## What the protected release can deploy

- Next.js app routes for `/storytime`, `/storytime/[sessionId]`, `/storytime/settings`, and `/share/story/[shareId]`.
- Firebase Hosting configuration.
- Firestore rules and indexes for Storytime collections.
- Firebase callable functions for governed Storytime generation, public-share lifecycle, narrator scripts, emotional arcs, weekly scrolls, voiceover hooks, timeline refresh, and archive rebuild.
- Storytime TypeScript domain models and safety/redaction helpers.
- Asset Factory integration seams where separately configured and authorized.

Source existence does not prove provider deployment or public-sharing readiness.

## Required application configuration

Local development may use the public Firebase client configuration and non-production feature flags appropriate to the selected environment. Provider and model secrets must stay in protected provider/GitHub environment secret storage and must never be committed.

Representative non-secret/runtime configuration includes:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
STORYTIME_CLOUD_MODE
STORYTIME_PUBLIC_SHARING
ASSET_FACTORY_BASE_URL
```

Do not provision `FIREBASE_TOKEN`, service-account JSON, Firebase Admin private keys, authorized-user ADC, or an interactive Firebase login as Storytime production deployment authority.

## Local install and verification

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run test:e2e
npm run test:deployment
npm run test:security-rules
npm run test:emulator-scaffold
npm run test:emulator-runtime
npm run test:production-readiness
npm run build
npm --prefix functions ci
npm --prefix functions run build
```

Use the repository-owned emulator commands/tests for local rule and callable verification. Local emulator work is not a production deploy and does not establish provider identity, IAM, live data, or public-sharing evidence.

## Singular protected deployment authority

The only repository-owned staging/production deployment path is:

```text
Actions -> URAI Storytime Protected Deployment -> Run workflow
branch = main
environment = staging | production
base_url = exact protected environment URL
confirm = DEPLOY_STORYTIME
```

The workflow:

1. requires exact `main` and the protected target environment;
2. verifies/builds the exact source without cloud identity;
3. validates release configuration and legal/privacy/child-safety gates;
4. packages the exact verified payload;
5. authenticates only in the deploy job with GitHub OIDC + Google Workload Identity Federation;
6. impersonates the exact `GCP_STORYTIME_DEPLOY_SERVICE_ACCOUNT` through `GCP_WIF_PROVIDER`;
7. deploys non-interactively to the exact `URAI_STORYTIME_FIREBASE_PROJECT_ID`;
8. performs live route readback; and
9. retains a SHA-bound deployment receipt.

Missing WIF variables, provider trust, least-privilege IAM, protected approvals, or release-gate evidence must block deployment. Do not substitute local CLI credentials or long-lived keys.

## Production identity gate

Production remains **NO-GO** until the protected provider identity has been independently evidenced. Required evidence includes:

- exact WIF provider and authenticated principal;
- exact Storytime project and deployment service account;
- least-privilege IAM with no Owner/Editor dependency;
- negative-authentication proof;
- historical long-lived key/token revocation where applicable;
- Cloud Audit attribution;
- exact provider revision/source readback;
- monitoring/log visibility and alert ownership.

Google-managed runtime identity must use attached ADC/managed identity with the exact reviewed runtime service account. Source CI cannot substitute for provider evidence.

## Public sharing and provider execution

Keep `STORYTIME_PUBLIC_SHARING` fail closed until current legal/privacy/child-safety, retention/export/deletion, consent, moderation, voice/likeness, and publication approvals are proven. Provider generation must remain bounded by the repository's explicit spend and approval controls.

Do not use real family/private production material merely to demonstrate readiness.

## Post-deploy acceptance

After an authorized protected deployment, verify against the exact provider revision:

1. `/storytime` and `/storytime/settings` health;
2. authenticated private Storytime access;
3. unauthenticated/cross-user/cross-tenant denial;
4. Firestore/Storage rule behavior;
5. public-share disabled/expiry/revocation boundaries;
6. provider callbacks and retained receipts only where explicitly authorized;
7. monitoring, logs, alerts, recovery, and incident visibility;
8. exact deployed SHA/revision binding.

Synthetic/test identities must be cleaned up after controlled verification.

## Rollback

A real rollback is performed only through **URAI Storytime Protected Rollback Drill** on `main`, with:

```text
rollback_sha = exact previously deployed known-good ancestor
environment = staging | production
base_url = exact protected environment URL
confirm = DRILL_STORYTIME_ROLLBACK
```

The rollback SHA must be genuinely different from the current deployed candidate. The same SHA redeployed twice does not count. A completed rollback must retain the provider-mutating receipt and live health/readback on the restored revision.

`URAI Storytime Rollback Source Verification` is source-only evidence and does not count as an operational rollback.

## Evidence retention truth

GitHub-hosted public-repository artifacts are retained only for the supported configured period. Current Storytime release receipts request 90 days; any longer-lived institutional evidence claim requires a separately verified durable external archive bound to the exact source SHA, workflow run, receipt hash, and provider revision.

## Known launch boundary

This source architecture does not by itself prove production Firebase configuration, WIF/IAM, DNS/TLS, billing, provider generation, TTS/voice rights, Asset Factory runtime authority, public-sharing approval, monitoring, recovery, or distinct-revision rollback. Those remain independent fail-closed launch gates.