# Completion plan to 100%

## Immediate verification commands

Run from a fresh checkout of `main`:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run test:smoke
npm run test:env-template
npm run test:security-rules
npm run test:emulator-scaffold
npm run test:emulator-runtime
npm run test:provider-wiring
npm run build
cd functions && npm install && npm run build
```

Commit sanitized logs under the next proof folder.

## Firebase staging target setup

1. Replace `.firebaserc` placeholder with real staging project id and hosting target.
2. Configure Firebase Auth email/password in staging.
3. Configure Firestore and Storage emulator/test projects.
4. Deploy Firestore rules/indexes, Storage rules, Functions, and Hosting to staging.
5. Record deploy outputs without secrets.

## Emulator proof

1. Create two test users.
2. Generate a session as user A using controlled non-sensitive data.
3. Confirm user A can read all session bundle records.
4. Confirm user B cannot read user A private records.
5. Create and revoke a public share.
6. Confirm revoked public share is not publicly readable.
7. Confirm quota counters are client-denied.
8. Confirm Storage story/export paths are owner/admin restricted.

## Provider secret/model proof

1. Store `OPENAI_API_KEY` securely; never print or commit it.
2. Set `STORYTIME_GENERATION_PROVIDER=openai`.
3. Set approved `STORYTIME_OPENAI_MODEL`.
4. Run controlled non-sensitive generation through deployed callable.
5. Confirm provider marker is `openai` and output is valid JSON-shaped bundle.
6. Confirm unsafe input is blocked before provider call.

## Persistence proof

1. Confirm callable writes `storySessions`, `storyChapters`, `storyMoments`, `memoryScenes`, `narratorScripts`, `emotionalArcSummaries`.
2. Confirm `/storytime/[sessionId]` hydrates the saved bundle.
3. Confirm `SessionLibrary` lists it for owner only.
4. Confirm deletion/export/privacy request behavior is implemented or gated honestly.

## Share create/fetch/revoke proof

1. Create public-safe share with explicit consent.
2. Confirm `/share/story/[slug]` displays only redacted safe fields.
3. Confirm private story records are never publicly read.
4. Revoke share.
5. Confirm public route reports revoked/unavailable.
6. Confirm non-owner cannot revoke/update/delete.

## Export/voiceover proof

1. Queue `prepareVoiceoverJob` with explicit voiceover consent.
2. Process job through real worker/provider/Asset Factory.
3. Persist completed artifact metadata.
4. Write artifact to Storage protected path.
5. Confirm owner download works and non-owner access fails.

## Safety/legal/privacy review

1. Add/verify AI-generated content label.
2. Add/verify guardian/parental consent boundary before child-oriented use.
3. Verify privacy/terms links and alignment with actual data behavior.
4. Verify deletion/export/revocation flow.
5. Add prompt-injection, PII, and redaction tests.
6. Verify moderation/admin escalation path.
7. Record legal/safety approval.

## Production deploy proof

1. Create production Firebase target.
2. Repeat all local/CI/emulator/staging proof with production config and controlled data.
3. Deploy production.
4. Verify DNS/SSL.
5. Verify `/storytime`, demo, settings, saved session, public share, revoke, and rollback path.
6. Record monitoring/alerting and incident response.

## Final launch gate

Storytime is READY only when a real user can sign in, generate a provider-backed story, retrieve it from persisted records, see it in library, create/revoke a public-safe share, and exercise privacy/export/delete paths under verified deployed rules with legal/safety approval.
