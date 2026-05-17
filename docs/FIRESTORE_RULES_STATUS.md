# Firestore Rules Status

## Current State

The repository now includes a restrictive baseline Firestore rules configuration.

The current configuration intentionally blocks most collections until ownership validation and emulator testing are completed.

## Allowed Access

### users

Authenticated users may access only their own user document.

## Restricted Collections

The following collections are currently deny-by-default:

- families
- childProfiles
- stories
- storyRuns
- moderation
- auditLogs

## Purpose Of The Restrictive Baseline

This application handles family and child-oriented content.

A restrictive default configuration is safer than permissive placeholder rules.

The baseline is intended to reduce risk while:

- ownership systems are implemented
- emulator tests are added
- moderation systems are verified
- export and deletion permissions are defined

## Remaining Work

The following still require implementation and testing:

- family ownership verification
- guardian permissions
- child profile restrictions
- export authorization
- deletion authorization
- moderation access boundaries
- audit log restrictions

## Required Tests

- Firestore emulator tests
- unauthorized access tests
- cross-family isolation tests
- guardian permission tests
- export authorization tests
- deletion authorization tests

## Production Status

Production readiness remains blocked until rules are tested and verified against the real ownership model.
