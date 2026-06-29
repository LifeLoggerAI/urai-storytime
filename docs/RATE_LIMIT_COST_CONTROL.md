# URAI Storytime rate limit and cost control gate

Storytime must not be publicly launched with provider generation enabled until abuse and cost controls are verified.

## Required controls before provider-ready flag is enabled

- Authenticated user required for cloud generation.
- Per-user generation limit per hour.
- Per-user generation limit per day.
- Maximum prompt/source text length.
- Maximum output size from provider.
- Provider timeout.
- Provider retry limit.
- Provider spend alerting.
- Provider error logging without private story text.
- Safety block before provider call.
- Public sharing disabled by default.

## Minimum launch thresholds

- Max source text length: 12000 characters server side.
- Max UI source text length: 1200 characters demo/client side.
- Provider timeout: 30 seconds or lower.
- Provider retries: 1 retry or lower for user-triggered generation.
- Public share creation: explicit consent required.
- Revocation: must be callable and must make the public share unreadable.

## Release rule

If any required control is missing, keep these flags disabled:

- NEXT_PUBLIC_STORYTIME_PROVIDER_READY
- NEXT_PUBLIC_STORYTIME_CLOUD_MODE
- NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING

Production release must fail closed rather than silently using deterministic/demo output.
