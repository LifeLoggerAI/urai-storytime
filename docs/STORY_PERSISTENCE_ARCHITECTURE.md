# Story Persistence Architecture

## Current State

The current application primarily operates in local-demo persistence mode.

A persistence boundary module now exists so cloud persistence can be introduced without tightly coupling storage logic to UI components.

## Persistence Modes

### local-demo

Current default mode.

Uses browser local storage.

Intended for:

- demos
- local development
- temporary story persistence

Not appropriate for production family synchronization.

### firebase

Planned production persistence mode.

Requires:

- Firebase Auth
- verified Firestore rules
- family ownership model
- moderation verification
- export and deletion flows

## Current Record Model

Story records currently normalize:

- id
- title
- prompt
- story
- childProfileId
- familyId
- moderationDecision
- createdAt
- updatedAt
- persistenceMode

## Required Future Additions

Future production systems likely require:

- story playback state
- narrator metadata
- moderation audit references
- export metadata
- deletion metadata
- guardian ownership references
- retention metadata

## Production Blockers

Production cloud persistence remains blocked until:

- Firebase project verified
- Auth verified
- Firestore rules tested
- family isolation verified
- moderation pipeline verified
- deletion/export flows verified
