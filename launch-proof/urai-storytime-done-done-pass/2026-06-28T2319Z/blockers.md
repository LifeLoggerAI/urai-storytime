# Blockers

Timestamp: 2026-06-28T2319Z

## True blockers to PRODUCTION READY

1. No local build/test proof in this pass.
   - Container DNS failure prevented clone/install/test/build.

2. No live deployment proof.
   - No verified Firebase staging/production deploy happened.
   - No live URL smoke test happened.

3. Provider generation still requires staging proof.
   - OpenAI provider wrapper exists.
   - Secrets/model config are not committed and were not available.
   - Prompt/output safety must be reviewed before enabling `NEXT_PUBLIC_STORYTIME_PROVIDER_READY=true`.

4. Full saved session hydration remains partial.
   - `CloudSession` loads the private session document and states.
   - Full chapter/moment/scene/script hydration is not yet exposed in the cloud reader UI in this pass.

5. Public sharing creation/revocation UI remains missing.
   - Public share read route now exists and handles blocked/revoked/expired/not-found states.
   - Owner create/revoke controls are not implemented in the user UI.

6. Auth/account UX remains incomplete.
   - Firebase Auth requirement is enforced/communicated.
   - Sign-in/sign-out/account creation screens were not added in this pass.

7. Safety/legal/privacy proof remains incomplete.
   - Basic unsafe prompt blocking exists.
   - Public share redaction exists.
   - Full child/family safety review, legal copy, audit logs, retention/delete flows, and abuse reporting are not complete.

8. Firebase rules/emulator proof missing.
   - Rules/index files exist.
   - Emulator tests were not run here.

## Not blockers but important polish

- More complete cloud session viewer with chapters, moments, scenes, narrator scripts, and arc hydration.
- Better retry UX and user-facing Firebase error translation.
- Admin/operator moderation queue for needs-review items.
- Real screenshots after local browser or deployed staging URL is available.
