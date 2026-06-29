# URAI Storytime observability and audit logging gate

Storytime must not be promoted to production without privacy-safe observability for generation, sharing, revocation, provider failures, quota blocks, and safety blocks.

## Required production logs

Every cloud callable should produce structured logs for these events:

- generation requested
- generation blocked by auth
- generation blocked by consent
- generation blocked by safety
- generation blocked by quota
- provider unavailable
- provider failed
- story persisted
- public share created
- public share revoked
- voiceover/export queued

## Privacy rules

Logs must not include:

- full story source text
- generated story body
- child names
- addresses
- phone numbers
- emails
- raw provider prompts
- raw provider outputs

Logs may include:

- event name
- user id hash or uid only where appropriate for backend audit
- session id
- share id
- provider name
- safety status
- quota window
- error class/code
- timestamp

## Launch gate

Before production launch, verify that:

- Cloud Functions logs include structured event names.
- Provider failures are visible without leaking private content.
- Safety blocks are visible without logging unsafe prompt text.
- Quota blocks are visible with count/window metadata only.
- Share revocation logs are visible with share id/session id.
- Alerting exists for elevated provider failures and quota abuse.

## Release rule

If observability cannot prove these events without leaking private story content, keep cloud generation and public sharing disabled.
