# Environment variables

Last reconciled: 2026-07-06

This document lists names and purpose only. Never store values in Git.

## Firebase client

| Name | Purpose | Production rule |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web client config | isolated Storytime project |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain | verified custom/Firebase domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client project ID | must be Storytime project |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket | private Storytime bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client config | environment-specific |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | environment-specific |
| `NEXT_PUBLIC_STORYTIME_CLOUD_MODE` | Enables cloud UI path | false until auth/provider/rules verified |
| `NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING` | Enables public-share UI | false until lifecycle tests pass |
| `NEXT_PUBLIC_STORYTIME_PROVIDER_READY` | Client readiness indicator | evidence flag only; never security authority |

## Firebase server/deployment

| Name | Purpose | Production rule |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Admin SDK project | Secret/environment configuration |
| `FIREBASE_CLIENT_EMAIL` | Admin service identity | Secret manager |
| `FIREBASE_PRIVATE_KEY` | Admin credential | Secret manager; preserve newlines safely |
| `URAI_STORYTIME_FIREBASE_PROJECT_ID` | Canonical Storytime project | distinct from Core/Analytics |
| `URAI_STORYTIME_STAGING_TARGET` | Staging deployment target | recorded in release receipt |
| `URAI_STORYTIME_PRODUCTION_TARGET` | Production target | recorded in release receipt |
| `URAI_CORE_FIREBASE_PROJECT_ID` | Isolation comparison | must differ from Storytime |
| `URAI_ANALYTICS_FIREBASE_PROJECT_ID` | Isolation comparison | must differ from Storytime |
| `STORYTIME_FIREBASE_ISOLATED` | Production isolation gate | must be `true` only when verified |
| `STORYTIME_CLOUD_MODE` | Server cloud mode | enabled only in approved environment |
| `STORYTIME_PUBLIC_SHARING` | Server sharing mode | disabled until server/rules expiry proof |

## Story generation

| Name | Purpose | Production rule |
|---|---|---|
| `STORYTIME_GENERATION_PROVIDER` | Provider selector | currently supports `openai` or disabled |
| `STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER` | Non-production fallback | never true in production |
| `OPENAI_API_KEY` | Provider secret | Secret manager; no client exposure |
| `STORYTIME_OPENAI_MODEL` | Model selection | approved allow-list and receipt |
| `STORYTIME_MAX_GENERATIONS_PER_HOUR` | User quota | finite positive integer |
| `STORYTIME_MAX_GENERATIONS_PER_DAY` | User quota | finite positive integer |

The quota variables are consumed in Functions but are not currently present in `.env.example`; add them when the quota configuration contract is finalized.

## Public sharing

| Name | Purpose | Production rule |
|---|---|---|
| `STORYTIME_PUBLIC_SHARE_TTL_DAYS` | Default share lifetime | finite positive value; server-enforced expiry required |

## Asset Factory/media

| Name | Purpose | Production rule |
|---|---|---|
| `ASSET_FACTORY_BASE_URL` | Service endpoint | staging/production allow-list |
| `ASSET_FACTORY_API_KEY` | Service secret | Secret manager; scoped identity |

Future TTS/image/video provider variables must not be added until the provider, retention policy, cost ceiling, and consent gate are approved.

## Validation requirements

Production configuration is valid only when:

1. Storytime project IDs are real and isolated.
2. client and server project IDs agree.
3. cloud/share flags are false unless their complete release gates pass.
4. deterministic server fallback is false.
5. provider and Asset Factory secrets exist only in secret storage.
6. no secret values appear in logs, artifacts, screenshots, issues, or documentation.
