# Storytime ↔ URAI Admin Moderation Contract

## Ownership

Storytime owns:
- pre-generation and post-generation safety checks;
- private moderation records;
- reason codes;
- content fingerprints;
- quarantine/fail-closed behavior;
- user-facing blocked/review-required states.

URAI Admin owns:
- privileged moderator access;
- review queues;
- reviewer roles;
- decision authority;
- escalation;
- audit evidence;
- separation of duties;
- operational incident handling.

Storytime must not grow a hidden privileged moderation console.

## Handoff

The source contract is `storytime-admin-moderation-v1`.

A Storytime review handoff carries:
- moderation record identity;
- request identity;
- input/output stage;
- normalized reason codes;
- SHA-256 content fingerprint;
- hashed user/session references;
- provenance;
- request time.

It explicitly carries **no raw story content**.

The default activation state is `hard_off`.

## Decision receipt

A decision returning from Admin must include:
- decision identity;
- reviewer principal and governed role;
- separation-of-duties result;
- evidence receipt ID;
- Admin audit event ID;
- applied policy version;
- decision timestamp.

A decision receipt containing raw story content or lacking separation-of-duties/evidence authority is invalid.

## Activation gates

Do not activate the handoff until:
1. Admin provides a reviewed Storytime moderation queue contract;
2. least-privilege moderator roles are deployed and proven;
3. access logging is retained;
4. policy versioning and escalation/appeal procedures are approved;
5. sensitive-content retention is approved;
6. synthetic staging handoff/decision/replay tests pass;
7. unauthorized reviewer denial is proven;
8. exact-head Storytime and Admin evidence is retained.

## Truth boundary

This contract is a prebuilt integration foundation.

It does not establish:
- a live Admin queue;
- live moderator access;
- an approved safety policy;
- legal/child-safety approval;
- production escalation;
- production incident operations.

Those remain separate governed runtime gates.
