# URAI Storytime Auth And Family Ownership Model

## Status

Architecture planning only.

Production authentication is NOT verified.

## Core requirements

URAI Storytime must not treat child accounts as standalone unrestricted users.

A verified adult account boundary is required before production launch.

## Required capabilities

### Adult account ownership

Adults own:

- subscriptions
- billing
- family management
- exports
- deletions
- moderation escalations
- consent decisions

### Family model

A family document groups:

- guardians
- children
- story ownership
- moderation relationships
- subscription relationships

### Child profiles

Child profiles are not standalone unrestricted accounts.

Child profiles should support:

- age ranges
- narrator preferences
- content restrictions
- progression state
- orb progression
- playback preferences

## Required future Firebase rules

- deny cross-family reads
- deny cross-family writes
- deny unauthorized exports
- deny unauthorized deletions
- deny child escalation privileges
- deny unrestricted moderation access

## Required future flows

- onboarding
- account recovery
- consent collection
- export flow
- deletion flow
- moderation appeal flow

## Required future tests

- family isolation tests
- unauthorized access tests
- deletion tests
- export tests
- guardian permission tests
- child access restriction tests

## Production blockers

Production launch remains blocked until:

- auth provider verified
- Firebase Auth verified
- family isolation rules verified
- deletion flow verified
- export flow verified
- moderation escalation flow verified
