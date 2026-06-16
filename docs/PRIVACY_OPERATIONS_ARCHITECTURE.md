# Privacy Operations Architecture

## Current State

Privacy operations are currently architectural scaffolds only.

Production export and deletion systems are NOT yet implemented.

## Supported Privacy Request Types

### export

Intended future capability:

- export family data
- export stories
- export moderation history
- export playback metadata

### deletion

Intended future capability:

- delete family data
- delete child profile data
- delete stories
- delete moderation references where appropriate

## Required Production Capabilities

Production implementation requires:

- verified adult ownership
- verified family ownership
- audit logging
- deletion confirmation flows
- export authorization
- moderation-aware deletion handling
- retention policy handling

## Required Future Firebase Systems

- privacyRequests collection
- auditLogs collection
- deletion job processing
- export job processing
- guardian verification

## Required Future Tests

- unauthorized export tests
- unauthorized deletion tests
- cross-family isolation tests
- deletion audit tests
- export audit tests

## Production Blockers

Production launch remains blocked until:

- export flow verified
- deletion flow verified
- guardian ownership verified
- audit logging verified
- retention policy reviewed
