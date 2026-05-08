# URAI-StoryTime 2.5+ Architecture

## Architecture goal
URAI-StoryTime should evolve from a local static demo into a standalone, provider-agnostic, family-safe storytelling platform with modular integrations into the broader URAI ecosystem.

The architecture must preserve local demo mode while enabling authenticated cloud mode, AI generation, moderation, narration, replay, and admin operations.

## Current baseline architecture

```text
src/index.html
  └── src/app.js
        ├── hash routes
        ├── localStorage library
        ├── create story form
        ├── story detail view
        ├── browser speech synthesis
        └── src/story-engine.mjs
              ├── prompt blocklist
              └── local template story generation
```

Current scripts:
- `scripts/server.mjs`: serves `src/` locally.
- `scripts/build.mjs`: copies top-level `src` files into `dist/`.
- `scripts/lint.mjs`: placeholder static-lint skip.
- `scripts/typecheck.mjs`: placeholder TypeScript-not-configured note.
- `scripts/format-check.mjs`: placeholder format-check skip.

## Target architecture

```text
Public Website
  ├── Landing
  ├── Demo
  ├── Parents
  ├── Creators
  ├── Safety
  ├── Pricing / Waitlist
  └── Legal

StoryTime App
  ├── Auth
  ├── Parent Dashboard
  ├── Child Profiles
  ├── Story Creation Wizard
  ├── Story Library
  ├── Story Playback
  ├── Narrator Settings
  └── Family Settings

AI Story Engine
  ├── Story Request Normalizer
  ├── Safety Precheck
  ├── Story Planner
  ├── Story Writer
  ├── Safety Postcheck
  ├── Scene Splitter
  ├── Emotional Adapter
  ├── Symbolic Motif Mapper
  └── Replay Manifest Builder

Media Engine
  ├── Web Speech Fallback
  ├── TTS Provider Adapter
  ├── Captions
  ├── Audio Assets
  └── Playback Timeline

Admin / Moderation
  ├── Flagged Content Queue
  ├── Safety Reviews
  ├── Story Inspection
  ├── User / Family Lookup
  ├── Audit Logs
  └── System Health

URAI Integrations
  ├── URAI Auth
  ├── URAI Privacy
  ├── URAI Memory
  ├── URAI Companion
  ├── URAI Symbolic Engine
  ├── URAI Voice
  ├── URAI Admin
  └── URAI Analytics
```

## Recommended repository structure

```text
/
  public/
  src/
    app/
      routes/
      pages/
      components/
      layouts/
    core/
      types/
      config/
      constants/
      errors/
    story-engine/
      StoryEngine.ts
      StoryPlanner.ts
      StoryWriter.ts
      SceneSplitter.ts
      StoryManifestBuilder.ts
      providers/
        LocalDemoStoryProvider.ts
        AIStoryProvider.ts
    safety/
      SafetyProvider.ts
      LocalSafetyProvider.ts
      SafetyPolicy.ts
      moderationRules.ts
    narration/
      NarrationProvider.ts
      WebSpeechNarrationProvider.ts
      TTSProvider.ts
      CaptionBuilder.ts
      PlaybackManifest.ts
    family/
      childProfiles.ts
      parentSettings.ts
      familyPermissions.ts
    storage/
      LocalDemoStorage.ts
      FirebaseStoryStorage.ts
      FirebaseFamilyStorage.ts
    firebase/
      client.ts
      admin.ts
      auth.ts
      firestore.ts
    admin/
      moderationQueue.ts
      auditLogs.ts
      systemHealth.ts
    website/
      sitemap.ts
      seo.ts
      metadata.ts
    tests/
      unit/
      integration/
      e2e/
  functions/
    src/
      generateStory.ts
      safetyReview.ts
      narrationJob.ts
      moderationQueue.ts
  docs/
```

## Core domain models

### User
Represents an authenticated adult account or internal operator.

Fields:
- `id`
- `email`
- `displayName`
- `roles`
- `createdAt`
- `updatedAt`

### Family
Represents a private family workspace.

Fields:
- `id`
- `ownerUserId`
- `memberUserIds`
- `defaultSafetyPolicyId`
- `createdAt`
- `updatedAt`

### ChildProfile
Represents a parent-managed child profile.

Fields:
- `id`
- `familyId`
- `displayName`
- `ageBand`
- `allowedThemes`
- `blockedThemes`
- `narratorPreference`
- `createdAt`
- `updatedAt`

### StoryRequest
Input to the story engine.

Fields:
- `id`
- `familyId`
- `childProfileId`
- `theme`
- `mood`
- `narratorId`
- `prompt`
- `memorySeedIds`
- `safetyPolicyId`
- `createdAt`

### StoryRun
Tracks one generation attempt.

Fields:
- `id`
- `requestId`
- `provider`
- `status`
- `safetyPrecheckId`
- `safetyPostcheckId`
- `errorCode`
- `createdAt`
- `completedAt`

### StoryManifest
Final replay-ready object.

Fields:
- `id`
- `storyRunId`
- `title`
- `summary`
- `scenes`
- `narratorId`
- `captionTrackId`
- `audioAssetIds`
- `safetyReviewId`
- `createdAt`

### SafetyReview
Records safety decisions.

Fields:
- `id`
- `targetType`
- `targetId`
- `ageBand`
- `classification`
- `blockedReasons`
- `reviewStatus`
- `reviewedBy`
- `createdAt`

## Provider boundaries

### AIStoryProvider
Responsible for planning and drafting stories. Must not own storage or UI behavior.

### SafetyProvider
Responsible for input/output classification, age-band enforcement, and policy decisions.

### NarrationProvider
Responsible for narration scripts, speech fallback, TTS job creation, and provider-specific voice behavior.

### StorageProvider
Responsible for local demo persistence or cloud persistence.

### SymbolicThemeProvider
Responsible for translating themes/moods into safe symbolic motifs.

### MemorySeedProvider
Responsible for retrieving and redacting approved memory seeds. Must be opt-in and privacy-safe.

## Data storage modes

### Local demo mode
- Uses browser localStorage.
- Requires no account.
- Stores only on the current device/browser.
- Good for demo and fallback.

### Cloud mode
- Requires authenticated user.
- Stores family, child profile, story, safety, narration, and audit data in cloud database.
- Enforces rules by family membership and role.

## Recommended Firestore collections

```text
users
families
childProfiles
parentSettings
stories
storyRuns
storyScenes
narrationJobs
audioAssets
safetyReviews
moderationEvents
creatorProfiles
creatorSubmissions
adminAuditLogs
```

## Security architecture principles
- Family data is private by default.
- Stories are private by default.
- Child profiles are never publicly writable.
- Admin/moderator access requires role claims.
- Safety events are append-only where possible.
- Secrets must live in environment/secret manager only.
- Logs must avoid child-sensitive story content unless explicitly needed for moderation with access controls.
- Local demo mode must clearly tell users data is browser-local.

## Deployment architecture

Recommended environments:
- local
- staging
- production

Recommended launch flow:
1. Local tests.
2. Preview deploy.
3. Staging deploy.
4. Smoke test.
5. Production deploy.
6. Post-deploy domain smoke test.

## Non-goals for Phase 0
- Do not introduce Firebase.
- Do not add AI provider keys.
- Do not perform a framework rewrite.
- Do not claim legal compliance.
- Do not remove the local demo.

## Next architecture step
Phase 1 should introduce TypeScript domain models and provider interfaces while preserving the current local demo behavior.
