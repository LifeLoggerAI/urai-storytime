# Storytime — Owner consent and access authority matrix

**Status: source-level controls inspected; live owner permissions not certified.** The current Storytime source has several real guards, but none proves canonical account-wide source authorization.

| Action | Observed code boundary | Unverified requirement |
|---|---|---|
| Generation | Firebase UID, email_verified claim, self-asserted adult/guardian, request review, storyGeneration=true and providerProcessing=true | Signed owner-and-source-specific Privacy receipt; real guardian legal authority; current revocation |
| Draft save/delete | Verified user, Firestore owner transaction, expected revision and explicit storage consent; no provider consent implied | Runtime denied cross-owner and deletion cascade |
| Read/edit/restore | Firestore owner/admin Rules and backend version ownership | Fresh Auth after waits, protect canon/provenance against client-side mutation, owner-scoped live readbacks |
| Public share create | Verified adult account, safety-approved owned story, explicit sharing input, feature flag | Actual redacted content disclosure review, public read/expiry/revocation and cache testing |
| Public share revoke | Owner via control record, transaction revoke | Denial after revocation for every route/cached/download copy |
| Narrator/weekly/arc | Auth and owner checks on source session, database batch/write | Verified current source version and truthful evidence status |
| Jobs voiceover | Owned script and session, session voiceover consent, bridge token and purpose receipt | Real consent issuer before external send, output auth and provider cost, race-safe revocation and deletion |
| Storytime export | Scoped export request, server-only package, owner download controls and historical strengthened owner-branch changes | Whole-account authorization and current per-chunk cancellation; no unintended family/other-tenant content |
| Destructive deletion | Admin-approved plans / scoped verification source | Genuine owner request, legal/family holds, backup and provider purge, full-source completion receipts |
| Moderator/admin | Admin claim, reason-coded minimized moderation queue | Actual IAM least privilege, admin cross-user memory nonaccess and auditable escalation |
| Studio/Content/AssetFactory/Replay | Hard-off integration envelopes, source ID and nominal privacy class | Purpose-bound signed permission for every consumed source, derivative, viewer, and revocation |
| Memory graph import | sourceSignals and memoryUse fields only in inspected generation path | Source resolver with signed owner/capture permission, third-party consent, immutable hash, deletion fence |

**Never accept as sufficient on their own:** sourceSignals strings, a user-controlled consentSnapshot.memoryUse boolean, adult_or_guardian role text, existence of a project ID/API key, or a completed sample story. Admin SDK bypasses Firestore Rules; source-side and deployment IAM controls must also be tested.
