# Observability Architecture

## Current State

Observability is currently scaffolded only.

Production monitoring providers are NOT yet configured.

## Current Observability Event Types

- error
- performance
- user-action
- moderation
- deployment

## Planned Production Systems

### Error Logging

Potential providers:

- Firebase Crashlytics
- Sentry
- Google Cloud Logging

Required capabilities:

- frontend error capture
- backend error capture
- deployment error capture
- moderation pipeline errors
- auth failures

### Performance Monitoring

Required metrics:

- story generation duration
- moderation duration
- app startup duration
- deployment duration
- Firebase query duration

### Alerts

Required alerts:

- deployment failures
- auth failures
- moderation failures
- elevated error rates
- elevated latency

## Production Blockers

Production launch remains blocked until:

- error logging configured
- performance monitoring configured
- alerting configured
- deploy monitoring configured
- production dashboards verified
- smoke-test monitoring verified
