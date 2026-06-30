# Blocker register

## P0 blockers

| Severity | Issue | User-visible risk | Path | Fix required | Proof required | Acceptance criteria |
|---|---|---|---|---|---|---|
| P0 | Firebase target placeholder remains | Deploy commands may target no real project; no live product proof | `.firebaserc` | Replace with real staging/production Firebase project IDs/targets | Sanitized Firebase target/deploy evidence | Staging deploy succeeds and target is not placeholder. |
| P0 | No build/test receipts on current main | Broken app could be shipped unknowingly | `package.json`, tests, CI | Run install/lint/typecheck/tests/build/functions build | Command logs/CI green status | All required commands pass. |
| P0 | No emulator rules proof | Private sessions/shares may leak or block users | `firestore.rules`, `storage.rules` | Run emulator owner/non-owner/share/revoke/quota tests | Emulator logs | Owner allowed, non-owner denied, revoked public share denied. |
| P0 | No provider-backed generation proof | Fake/demo generation could be marketed as real AI | `functions/src/story-provider.ts`, Firebase secrets | Configure OpenAI provider via secrets and run controlled test | Sanitized callable receipt | `provider=openai`, session persisted, unsafe input blocked. |
| P0 | No live persistence proof | User library/session claims may be false | `functions/src/storytime.ts`, `CloudSession`, `SessionLibrary` | Deploy and smoke generation/readback | Firestore sanitized proof | Owner sees generated session in library and session route. |
| P0 | No public share live proof | Private data could leak or revoke may fail | `createPublicStoryShare`, `ShareStory`, `revokePublicStoryShare`, rules | Smoke create/fetch/revoke/non-owner-deny | Sanitized route/function proof | Share displays safe fields only and revoked share is inaccessible. |
| P0 | Child/minor safety approval missing | Unsafe child/family-facing claims | Storytime UI/docs/functions | Add guardian consent, AI labels, moderation, legal approval | Safety/legal artifact | Child-oriented use remains gated until approved. |

## P1 blockers

| Severity | Issue | Risk | Fix required | Acceptance criteria |
|---|---|---|---|---|
| P1 | Admin/moderation UI not verified | Unsafe content lacks review workflow | Add/verify admin review or hard-gate unsafe cases | Moderation route/actions protected and tested. |
| P1 | Share expiration creation unclear | Expired state may be unreachable | Add `expiresAt` policy or document no expiration | Test covers expiration behavior. |
| P1 | Deletion/export/privacy request completion unproven | Privacy compliance overclaim | Implement/verify request lifecycle | User request can be created, tracked, completed. |
| P1 | Provider failure tests missing | Partial data/error states could be unsafe | Add mocked provider failure tests | Failure returns safe error and no partial personal data leak. |

## P2 blockers

- Persist user Storytime settings instead of read-only settings copy.
- Improve account UX and password reset/verification states.
- Add owner-facing share management list.
- Add structured privacy-aware analytics with disclosure and opt-out.

## P3 blockers

- Cost/rate-limit operator dashboard.
- Backup/restore/runbook proof.
- Asset Factory or jobs integration for completed voiceover/export artifacts.
- Abuse monitoring and escalation dashboard.
