# URAI Storytime Firestore Data Model

## Status

Planning scaffold only.

No production Firestore schema is verified yet.

## Proposed collections

### users

Purpose:
- parent/adult account metadata
- preferences
- consent timestamps
- onboarding state

### families

Purpose:
- family grouping
- household ownership
- member relationships
- billing ownership

### childProfiles

Purpose:
- child-safe story preferences
- age ranges
- narrator preferences
- safety restrictions

### stories

Purpose:
- generated story metadata
- ownership references
- timestamps
- playback references

### storyRuns

Purpose:
- generation attempts
- moderation status
- runtime diagnostics

### moderation

Purpose:
- flagged prompts
- flagged outputs
- human review status

### auditLogs

Purpose:
- admin actions
- deletion actions
- export actions
- moderation actions

## Required security boundaries

- family isolation
- parent-only account management
- child-safe access restrictions
- deny-by-default admin paths
- audit logging
- moderation traceability

## Required future tests

- family isolation tests
- unauthorized read tests
- unauthorized write tests
- deletion verification tests
- moderation access tests
