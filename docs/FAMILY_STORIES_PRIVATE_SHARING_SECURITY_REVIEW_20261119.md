# R1586 Family Stories — Firebase integration review / HOLD

## Intent and observed source boundaries
This unmerged branch reuses Storytime's existing Firebase v2 onCall Functions,
current-authority bearer verification in `functions/src/privacy-actor.ts`,
server-created `storySessions` / `storyChapters`, existing
`consentDecisionReceipts` collection and provenance fields.

`grantFamilyStoryView`, `getFamilyStoryView` and `revokeFamilyStoryView`
are **review-only, disabled by default** and not deployed. They use real
Firebase Auth APIs `verifyIdToken(token, true)` and `getUser` through
`requireCurrentStorytimeOwner`. Reverify the actor after a transaction.
Both owner and recipient must be verified and current. Only exact recipient UID
and an independent, existing server-issued canonical Privacy receipt can unlock
the textual view. No auto-grant from a family tree, surname, or relationship.
Session owner remains the only direct reader of `storySessions`.

### Canonical Privacy handoff is not certified
Receipt purpose `storytime.family_share` and policy version
`family-story-share-v1` are **proposed**, not registered or yet signed off by
canonical Privacy. Only a receipt with `issuedBy=urai-privacy`, exact owner,
recipient, session, version, epoch, positive decision, expiry and nonrevoked
status is admissible. The local code never fabricates such a receipt.
Source-level checking of a marker does **not** prove issuer authenticity:
the production receipt collection's writer IAM, cross-system event delivery,
owner-wide withdrawal, deletion fence and anti-stale receipt admission still
require independent verification against canonical Privacy. Do not enable the
environment flag until these proofs pass.

### Scope
A named grant projects only one owner-approved story title/chapter summary and
safe provenance classification. Raw recordings, photographs, source signals,
narrator script, provider receipts, private version history, asset locations,
exports and family membership are never returned.

### Storage / Firestore boundary
Existing Storytime `storySessions` and related bundle documents stay owner-only;
`familyStoryViewGrants` and `familyStorySharingStates` are server-only.
A discovered historical Storage rule for
`families/{familyId}/stories/{storyId}/{fileName}` used broad family ID claims
for **both reads and writes**. This draft disables such direct client access
to prevent cross-story photo/audio leakage. Existing family asset workflows
must be checked for impact before merge. No new private storage writer or media
endpoint is created.

### Voice delivery / deletion
Do not equate narrator text with delivered audio. Existing
`storytime-voiceover-consent-admission.ts`,
`storytime-voiceover-delivery.ts`, Jobs bridge and source/generation-bound
deletion remain independent review gates. Verify
`storytime.voiceover` canonical purpose, authenticated private audio stream
revocation on each chunk, no stale generation deletion, and no GCS service
account stale-writer ability before real human media.
No generated voice likeness may be treated as consented source audio.

### Proof needed
1. Node 22 exact-tree Functions and web typechecks.
2. Real Firestore/Storage/Auth emulator with two verified synthetic UIDs
   plus outsider: one exact grant positive, sibling story denial, all other
   photos/recordings denial, expiry/version/epoch/revocation denial.
3. Independent canonical Privacy receipt issuance and withdrawal through
   the existing Privacy→Jobs v2 revoke delivery/ACK, not a forged test receipt.
4. Hosted same-SHA Firebase login, storage and WIF/IAM acceptance in an
   isolated safe project. Separate visual/device and third-party review.
5. Never deploy to production or enable private-memory writes from this PR.

**HOLD / NO-GO — SOURCE CANDIDATE, NOT FAMILY SHARING CERTIFICATION.**
