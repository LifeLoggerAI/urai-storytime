# Storytime production environment contract

Last reconciled: 2026-07-06

This document completes the production-only variable contract enforced by `scripts/validate-live-production-config.mjs`. It records names and approval semantics only. Values must never be committed.

## Additional required production variables

| Name | Purpose | Evidence required before the value may enable production |
|---|---|---|
| `FIREBASE_AUTH_EMAIL_PROVIDER_ENABLED` | Confirms that the Firebase email authentication provider is active in the isolated Storytime project. | Auth-provider configuration receipt and a successful staging sign-in, sign-out, recovery, and session-expiry test. |
| `URAI_PRODUCTION_URL` | Identifies the canonical HTTPS Storytime production surface used by release verification. | Deployment receipt, DNS/SSL verification, exact deployed SHA, deep-link smoke, and rollback reference. |
| `URAI_LEGAL_APPROVED` | Records qualified legal approval for the exact live terms, sharing model, provider use, and child-facing behavior. | Dated approval receipt. Application code or CI must never self-approve this value. |
| `URAI_PRIVACY_APPROVED` | Records approval of consent, provider data sharing, retention, export, deletion, audit, and incident handling. | Dated privacy-review receipt tied to the release SHA and deployed environment. |
| `URAI_CHILD_SAFETY_APPROVED` | Records approval of audience policy, moderation, parental controls, provider safety, and incident procedures. | Dated child-safety review receipt tied to the release SHA and deployed environment. |

## Production rule

The three approval variables must be exactly `true` only after their external receipts exist. They must not be set to satisfy CI, unblock a deployment, or represent an implementation team's self-attestation.

The production URL must not be localhost, a preview channel, or staging. The Auth provider flag must not be set until the provider is enabled and independently exercised in the isolated Storytime Firebase project.

## Executable authority

The executable gate is `scripts/validate-live-production-config.mjs`. The general variable inventory remains `docs/ENVIRONMENT_VARIABLES.md`. This contract is normative for the five production requirements above and must be updated in the same pull request whenever the validator changes those requirements.

## Current status

All five values remain externally gated. Their presence in this contract does not mean production approval, deployment, or provider activation has occurred.
