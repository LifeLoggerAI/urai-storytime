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
- [ ] Narrator copy makes no diagnosis, manipulation, or medical certainty claims.
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


## Accessibility and browser certification

Source foundations are necessary but do not count as runtime certification. See `docs/ACCESSIBILITY.md`.

- [ ] Skip navigation reaches the Storytime main landmark with visible focus.
- [ ] All launch flows are usable keyboard-only with no focus trap.
- [ ] Visible focus survives forced-colors/high-contrast mode.
- [ ] Automated browser accessibility scan has no critical violations on launch routes.
- [ ] Screen-reader smoke confirms landmark, heading, form-label, error/status, story, and sharing reading order.
- [ ] 200% text zoom preserves content and controls without hidden required information.
- [ ] Mobile/narrow reflow remains one-column and touch targets remain usable.
- [ ] Reduced-motion mode removes non-essential motion without hiding state.
- [ ] Async create/auth/share/privacy failures preserve understandable focus and text feedback.
- [ ] Accessibility/browser evidence is bound to the exact release SHA and uses synthetic test data only.

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
