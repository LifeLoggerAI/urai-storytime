# Route map

| Route / surface | Purpose | Access | Backend dependency | User-visible claim | Status | Production verdict |
|---|---|---:|---|---|---:|---:|
| `/` | Legacy/default entry if retained | Public | Unknown from this pass | Legacy/demo entry may exist | UNKNOWN | Do not rely on as launch route until audited. |
| `/storytime` | Storytime home and private story seed UI | Public | Firebase client/functions only when cloud mode passes | Private story seed creation; demo fallback | PARTIAL | Safe as demo/product shell; not proof of live AI generation. |
| `/storytime/demo` | Deterministic local story session | Public | Local deterministic builder | Demo story session | DONE / MOCK-DEMO | Safe if labeled demo. Does not prove AI/provider/persistence. |
| `/storytime/[sessionId]` | Saved cloud session playback | Protected by Firebase Auth and Firestore rules when cloud mode configured | Firestore `storySessions`, `storyChapters`, `memoryScenes`, `narratorScripts`, `emotionalArcSummaries` | Saved story playback | PARTIAL/GATED | Needs deployed Auth/Firestore/rules proof. |
| `/storytime/settings` | Privacy/narrator settings copy | Public/read-only | None confirmed | Privacy and narrator controls | GATED/PARTIAL | Copy says read-only demo; not live persisted preferences. |
| Embedded `AuthPanel` | Sign in/create/sign out | Public UI; Firebase Auth dependency | Firebase Auth | Account access for cloud Storytime | PARTIAL/GATED | Needs production Auth config proof. |
| Embedded `SessionLibrary` | Saved session listing | Signed-in user when cloud mode configured | Firestore query on `storySessions` | User library | PARTIAL/GATED | Needs live/emulator proof. |
| `/share/story/demo` | Public-safe share demo shell | Public | Local demo copy | Share shell | DONE / MOCK-DEMO | Safe if labeled demo. |
| `/share/story/[shareId]` | Public-safe share route | Public read of non-revoked share only | Firestore `publicStoryShares` query by slug | Redacted public-safe share | PARTIAL/GATED | Needs create/fetch/revoke proof against deployed rules. |
| Embedded `ShareControls` | Create/revoke public share | Signed-in owner | Callable `createPublicStoryShare` and `revokePublicStoryShare` | Public-safe sharing and revocation | PARTIAL/GATED | Needs live/emulator owner-only proof. |
| Export/voiceover UI | Not confirmed as complete route | Protected/unknown | Callable `prepareVoiceoverJob`, future worker/artifact path | Voiceover/export queue | PARTIAL/BLOCKED | Job creation only; no artifact/download proof. |
| Admin/moderation UI | Not confirmed | Admin | Firestore `moderation`/`auditLogs` rules only | Admin review | NOT STARTED/PARTIAL | Need real admin/operator surface or explicit gate. |
| Debug/internal routes | None confirmed | Unknown | Unknown | None | UNKNOWN | Must be searched in a local checkout before launch. |

## Route risks

- `/storytime` copy is mostly honest but still strong product language; keep launch copy tied to verified capabilities.
- Demo routes are safe only while visibly labeled deterministic/non-persistent.
- Public share routes must never fetch private `storySessions` directly for public display.
- Session and library routes depend completely on Firebase client config, Auth, indexes, and Firestore rules proof.
