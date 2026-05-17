# URAI Storytime QA Checklist

## Build and type checks

- [ ] `npm install` completes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `cd functions && npm install && npm run build` passes.

## Routes

- [ ] `/storytime` loads.
- [ ] `/storytime/settings` loads.
- [ ] `/storytime/<sessionId>` loads and shows the player, timeline, memory scene, emotional arc, relationship thread, ritual card, and scroll preview.
- [ ] `/share/story/<shareId>` loads and is clearly public-safe/redacted.

## Firebase

- [ ] Firebase env vars are present in staging.
- [ ] Firestore rules deploy before any cloud UI launch.
- [ ] Firestore indexes deploy.
- [ ] Functions deploy.
- [ ] Signed-out callable requests fail with `unauthenticated`.
- [ ] Signed-in callable requests can create private story sessions.
- [ ] Cross-user reads/writes are denied.
- [ ] Public shares are readable only when `revoked == false`.
- [ ] Analytics events are append-only.

## Privacy and safety

- [ ] Story sessions default to `visibility: private`.
- [ ] Public sharing requires explicit consent.
- [ ] Public share text redacts names, addresses, emails, and phone numbers.
- [ ] Every session includes `whyGenerated`.
- [ ] Safety checks mark sensitive terms as `needs_review`.
- [ ] Narrator copy avoids diagnosis, manipulation, or medical certainty.
- [ ] UI does not claim therapy, diagnosis, live passive sensing, or child/family compliance without deployment evidence.

## Storytime system-of-systems

- [ ] Story sessions create linked chapters.
- [ ] Chapters create linked moments.
- [ ] Moments can link memory scenes.
- [ ] Narrator scripts link to sessions and chapters.
- [ ] Emotional arc summaries link to sessions.
- [ ] Relationship threads are redacted before public-facing use.
- [ ] Ritual storycards render with narrator copy.
- [ ] Weekly scroll previews are export-ready but not auto-shared.
- [ ] Asset-Factory jobs are disabled unless `ASSET_FACTORY_BASE_URL` and `ASSET_FACTORY_API_KEY` are configured.

## Deployment smoke

- [ ] Staging deploy completes.
- [ ] Production deploy completes only after staging passes.
- [ ] Firebase logs show no function startup errors.
- [ ] Hosting routes return 200.
- [ ] Rollback command is documented and tested.

## Done definition

- [ ] No P0 launch blockers remain.
- [ ] No public copy overclaims unimplemented systems.
- [ ] Security rules and Functions are tested in staging.
- [ ] Domain and SSL are verified after deploy.
