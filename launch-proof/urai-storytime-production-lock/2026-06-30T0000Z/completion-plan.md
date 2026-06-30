# Completion plan to 100%

## Phase 1 — Verification lock

- Check out repo from `main`.
- Run dependency install and all root/function builds/tests.
- Save raw command logs under this proof folder or a successor timestamped folder.
- Fix any type/build/test failures without weakening safety gates.
- Run Firebase emulator tests for Firestore/Storage/Auth behavior.

Exit criteria: clean local/CI build/test/emulator proof committed.

## Phase 2 — Firebase staging deploy

- Replace `.firebaserc` placeholder with real staging project and hosting target.
- Configure Firebase Auth email/password provider in staging.
- Deploy Firestore rules/indexes, Storage rules, Functions, and Hosting.
- Record deploy command output and hosting URL.
- Smoke test `/storytime`, `/storytime/demo`, `/storytime/settings`, `/storytime/{realSessionId}`, `/share/story/demo`, and `/share/story/{realSlug}`.

Exit criteria: staging URL, DNS/SSL, routes, and rollback path documented.

## Phase 3 — Controlled provider proof

- Configure OpenAI provider/model using secrets only.
- Run controlled non-sensitive test generation.
- Verify safety block on sensitive input.
- Verify provider failure handling.
- Verify generated session/chapter/moment/scene/script/arc records are written and readable only by owner.
- Verify audit logs do not include raw prompts/story bodies.

Exit criteria: real provider is verified without unsafe data exposure.

## Phase 4 — Public share proof

- Create a private session.
- Create public-safe share with explicit consent.
- Confirm public route displays only redacted/safe fields.
- Revoke share.
- Confirm public route no longer displays revoked share.
- Confirm non-owner cannot update/delete share/session.

Exit criteria: share create/fetch/revoke is proven against deployed rules.

## Phase 5 — Safety/legal/privacy lock

- Approve AI labeling and user-facing disclaimers.
- Approve child/minor/guardian consent boundary.
- Verify privacy request, deletion, export, and revocation flows.
- Add moderation/admin review workflow or explicitly gate it.
- Add retention and abuse escalation documentation.

Exit criteria: legal/safety approval artifacts are committed.

## Phase 6 — Production release

- Create production Firebase project targets.
- Repeat full build/test/emulator/provider/share proof against production config with controlled data.
- Verify production DNS/SSL and monitoring.
- Record rollback and incident response steps.
- Only then switch public copy from production-blocked to launched.

Exit criteria: public production claims are evidence-backed.

## 100% definition

Storytime reaches 100% only when a real user can sign in, create a story using the configured provider, retrieve the persisted session, see it in their library, create a public-safe redacted share with consent, revoke that share, export or queue export honestly, and exercise privacy/deletion controls under verified deployed Firebase rules with safety/legal approval.
