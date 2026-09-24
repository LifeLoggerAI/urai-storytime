# URAI Storytime QA Checklist

This checklist separates source-level contracts from runtime certification. A checked source item is not a browser, assistive-technology, Firebase, provider, or production certification.

## Build and type checks

- [ ] `npm ci` completes from the exact candidate SHA.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm --prefix functions ci && npm --prefix functions run build` passes.
- [ ] Exact-head CI/Verify/Visual Proof receipts are retained.

## Routes and state

- [ ] `/storytime` loads.
- [ ] `/storytime/settings` loads.
- [ ] `/storytime/<sessionId>` loads only the authenticated owner’s session.
- [ ] `/share/story/<shareId>` exposes only the generic governed public-safe derivative.
- [ ] Loading, signed-out, not-found, blocked, and error states are visibly and semantically distinct.
- [ ] No route exposes developer setup instructions, raw provider errors, secrets, or private identifiers.

## Accessibility source contract

Current source includes:

- semantic `main`, labeled navigation, headings, labeled forms, and native form controls;
- required account/story fields with native validation metadata;
- live validation/status regions for Storytime creation;
- assertive error and polite status regions for cloud session and sharing feedback;
- explicit busy state during story generation and cloud loading;
- visible keyboard focus for buttons, navigation links, card links, brand links, and consent checkboxes;
- reduced-motion CSS that disables animation/transition behavior and smooth scrolling;
- forced-colors borders and focus outlines;
- responsive single-column collapse and zero-minimum grid tracks for narrow viewports.

These are **source-level contracts only**.

## Accessibility runtime certification — still required

- [ ] Keyboard-only journey: sign in/create account → Storytime form → session → sharing → settings/privacy.
- [ ] No keyboard trap exists.
- [ ] Focus order matches visual and reading order.
- [ ] Focus remains visible at 200% and 400% zoom.
- [ ] Screen-reader journey is tested with at least one desktop and one mobile screen reader.
- [ ] Status/error messages are announced exactly once and at the correct priority.
- [ ] Required/invalid form state is understandable without color.
- [ ] Text resize/reflow works without horizontal page scrolling at the target viewport.
- [ ] Forced-colors/high-contrast mode keeps controls, focus, errors, and links distinguishable.
- [ ] Reduced-motion preference produces no essential-information loss.
- [ ] Touch targets and mobile layouts are verified on representative phone/tablet viewports.
- [ ] Automated accessibility checks run against real rendered pages and have no unresolved critical violations.
- [ ] Performance/Lighthouse budgets are measured on the exact candidate SHA.
- [ ] Captions/transcript/playback-speed/accessible audio controls are tested only when narration/media is actually implemented.

Do not claim complete narration accessibility while voiceover/media execution is hard-off.

## Firebase authorization

- [ ] Firebase env vars are present in an isolated Storytime staging project.
- [ ] Firestore rules deploy before cloud UI activation.
- [ ] Firestore indexes deploy.
- [ ] Functions deploy from the exact candidate SHA.
- [ ] Signed-out callable requests fail with `unauthenticated`.
- [ ] Signed-in verified adults can create private story sessions.
- [ ] Cross-user reads/writes are denied.
- [ ] Public active shares are readable only through the governed public derivative.
- [ ] Revoked and expired public shares are denied.
- [ ] Server-only counters, generation receipts, deletion plans, completion receipts, and archive snapshots are inaccessible to clients.
- [ ] Storage owner/non-owner/admin behavior has executable emulator/staging proof.

## Privacy and safety

- [ ] Story sessions default to `visibility: private`.
- [ ] Generation requires explicit adult/guardian affirmation, story-generation consent, and provider-processing consent.
- [ ] Audience age bands are enforced on the server.
- [ ] Public sharing requires explicit separate consent and verified account state.
- [ ] Public share records contain no private owner/session/source identifiers.
- [ ] Every generated session records why it exists and its consent/provenance snapshot.
- [ ] Unsafe input/output is prevented from becoming ready/shareable content.
- [ ] Moderation records contain reason codes/fingerprints rather than raw story bodies.
- [ ] Storytime-generated narrative is labeled as creative derivative, not source memory evidence.
- [ ] User-facing errors do not expose raw provider/callable response text.
- [ ] Uncertain paid-provider failures retain the conservative budget reservation and a server-only reconciliation dead letter.
- [ ] Provider dead letters retain no raw story content and never authorize automatic retry or budget release.
- [ ] UI does not claim therapy, diagnosis, child-account readiness, multilingual certification, emergency monitoring, or media/provider readiness without evidence.
- [ ] Generated Storytime copy avoids diagnosis and does not present creative narrative as clinical judgment, treatment, or source-memory evidence.
- [ ] Owner category-only safety reporting creates a server-owned report and sanitized `user_report` moderation case.
- [ ] Safety reporting does not copy raw story text or free-form sensitive notes into the moderation queue.
- [ ] Safety reports are included in export/deletion inventories.
- [ ] Cross-owner safety reporting is denied.
- [ ] Reporting abuse/rate controls and operator escalation are proven before family-facing production claims.

## Data rights

- [ ] Storytime-owned export package and integrity manifest are generated in isolated staging.
- [ ] Signed export URL is owner-only and expires as designed.
- [ ] Cross-owner export access is denied.
- [ ] Deletion dry run produces the current deterministic plan hash.
- [ ] Active legal hold blocks deletion.
- [ ] Family/child/shared authority blocks destructive account deletion pending URAI Privacy resolution.
- [ ] Provider/media references block deletion until their governed cleanup is proven.
- [ ] Stale deletion plan hash is rejected.
- [ ] Partial destructive failure enters recoverable `retry_required`, never `completed`.
- [ ] Post-delete verification finds no active Storytime-owned targets.
- [ ] Account deletion verifies Firebase Auth removal only in the certified isolated Storytime environment.
- [ ] Backup-retention/restore policy is certified before final deletion-complete status.

## Storytime system-of-systems

- [ ] Story sessions create linked chapters/moments/scenes.
- [ ] Narrator scripts and emotional-arc summaries are deterministic completed records when their local writes complete.
- [ ] Weekly Storytime scrolls, timeline refreshes, and archive rebuilds report completion only after persistence.
- [ ] Voiceover/media execution remains fail-closed until a real governed worker exists.
- [ ] Asset Factory execution additionally requires `STORYTIME_ASSET_FACTORY_EXECUTION=true`; URL/key presence alone is insufficient.
- [ ] Studio, Content, Asset Factory, and Spatial future envelopes remain `hard_off`, `publicReleaseAuthorized=false`, and `providerSpendAuthorized=false`.
- [ ] Non-English Storytime locales remain hard-off until per-locale native/safety/accessibility/RTL/legal review is complete.

## Deployment and operations

- [ ] `.firebaserc` contains a real, reviewed isolated Storytime staging project instead of the placeholder.
- [ ] Protected staging deploy completes from an exact green SHA.
- [ ] Live route/function/rules/storage readback binds deployment to that SHA.
- [ ] Monitoring/logging is live and contains no raw stories or secrets.
- [ ] Alert test is retained.
- [ ] Backup/restore drill is retained.
- [ ] Rollback restores a genuinely different known-good revision and is smoke-tested.
- [ ] Production deployment occurs only after staging, independent review, privacy/safety/legal, and operational gates pass.

## Done definition

Storytime is not production-certified until:

- no P0 launch blocker remains for the enabled feature set;
- exact-head CI and independent review are complete;
- authorization/data-rights behavior is proven in isolated staging;
- browser/mobile/accessibility/security/performance evidence is attached;
- public copy matches the exact enabled capability set;
- provider/media/future systems remain disabled unless their own activation gates are proven;
- DNS/TLS/live deployment/readback/monitoring/rollback evidence is retained.
