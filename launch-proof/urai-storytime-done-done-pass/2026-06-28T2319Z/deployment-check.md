# Deployment check

Timestamp: 2026-06-28T2319Z

## Verdict

Deployment was not performed in this pass.

## Why not

- No verified Firebase project target was available from the prior proof baseline.
- `.firebaserc` was previously verified as containing a placeholder staging project value.
- No deploy credentials or live URL verification path was available to this session.
- Local checkout failed because the container could not resolve `github.com`, so even deployment-readiness commands could not be run locally.

## Deploy targets still requiring verification

- Firebase project id for staging.
- Firebase project id for production.
- Hosting target for `urai-storytime-staging`.
- Production domain target, if any.
- DNS/SSL for public domain.
- Functions region and callable URL health.
- Firestore rules/index deployment.
- Storage rules deployment.

## Staging deployment checklist

1. Replace `.firebaserc` placeholder with verified staging project id.
2. Configure non-source-controlled secrets:
   - Firebase Admin credentials or deploy auth.
   - `STORYTIME_GENERATION_PROVIDER=openai` only after prompt/output review.
   - `OPENAI_API_KEY`.
   - `STORYTIME_OPENAI_MODEL`.
3. Keep public gates false until staging smoke succeeds:
   - `NEXT_PUBLIC_STORYTIME_CLOUD_MODE=false` initially.
   - `NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING=false` initially.
   - `NEXT_PUBLIC_STORYTIME_PROVIDER_READY=false` initially.
4. Deploy rules/indexes/functions/hosting.
5. Run staging smoke tests for:
   - Demo story route.
   - Signed-out cloud create blocked state.
   - Signed-in cloud create with provider configured.
   - Saved session route retrieval.
   - Public share creation and retrieval.
   - Revoked public share blocked state.
6. Only after evidence, enable client public gates in staging.

## Production deployment checklist

Production remains blocked until staging proof passes and legal/safety/privacy review is complete.
