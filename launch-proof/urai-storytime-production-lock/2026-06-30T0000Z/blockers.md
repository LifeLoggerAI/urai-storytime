# Blockers

## P0 blockers — must close before production launch

1. Replace placeholder Firebase target.
   - `.firebaserc` still uses `REPLACE_WITH_URAI_STORYTIME_STAGING`.
   - Add real staging and production project IDs/hosting targets.

2. Produce clean local/CI verification.
   - `npm install`
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run test:smoke`
   - `npm run test:security-rules`
   - `npm run test:emulator-runtime`
   - `npm run build`
   - `cd functions && npm install && npm run build`

3. Prove Firebase emulator security behavior.
   - Owner can create/read own story session bundle.
   - Non-owner cannot read private session.
   - Public share read works only when `revoked == false`.
   - Revoked share cannot be read publicly.
   - Quota counters cannot be read/written by clients.
   - Storage export/story assets are restricted correctly.

4. Prove deployed cloud behavior.
   - Firebase Auth sign-up/sign-in works in staging.
   - `generateStorySession` callable runs with controlled non-sensitive test input.
   - Story bundle persists and can be read back by owner.
   - Public share create/fetch/revoke works end-to-end.
   - Provider failure is handled without saving partial personal data.

5. Configure and review real provider.
   - `STORYTIME_GENERATION_PROVIDER=openai`
   - `OPENAI_API_KEY` set only in secret manager/runtime config.
   - `STORYTIME_OPENAI_MODEL` selected and documented.
   - Safety/legal/child-minor prompt/output review completed.

6. Production privacy/safety/legal lock.
   - Guardian/child-consent boundary approved.
   - AI labeling/disclaimer approved.
   - Deletion/export/revocation behavior verified.
   - Data retention and public-share warning copy approved.

## P1 blockers — required for beta/hardened staging

1. Add or verify admin/operator moderation review UI.
2. Add malicious-input tests for redaction and sensitive personal details.
3. Add integration tests for share slug/id lookup and revoked/expired states.
4. Add provider contract tests with mocked OpenAI response/failure cases.
5. Add user-visible privacy request/deletion/export completion path.
6. Record staging URL, DNS/SSL, rollback, and deployment evidence.

## P2 blockers — production polish

1. Improve account UX beyond embedded email/password panel.
2. Add better empty/error/retry states for cloud session hydration.
3. Add persisted user preferences instead of read-only settings copy.
4. Add structured analytics with privacy disclosure and opt-out.
5. Add share expiration controls and owner-visible share management.

## P3 blockers — scale/ops

1. Rate-limit and quota dashboard for operators.
2. Cost monitoring for provider generation.
3. Automated abuse/safety review queue.
4. Asset Factory integration for real voiceover/export artifacts.
5. Backup/restore/runbook proof.
