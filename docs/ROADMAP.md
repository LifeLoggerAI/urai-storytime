# URAI-StoryTime 2.5+ Roadmap

## North Star
URAI-StoryTime becomes a standalone, family-safe AI storytelling system that generates, narrates, replays, stores, moderates, and emotionally adapts personalized stories while integrating with URAI memory, narrator, symbolic, privacy, admin, and analytics systems.

## Final system architecture

```text
uraistorytime.com
  ├── Public Website
  │   ├── Landing
  │   ├── Demo
  │   ├── Parents
  │   ├── Creators
  │   ├── Safety
  │   ├── Pricing / Waitlist
  │   └── Legal
  ├── StoryTime App
  │   ├── Auth
  │   ├── Parent Dashboard
  │   ├── Child Profiles
  │   ├── Story Creation Wizard
  │   ├── Story Library
  │   ├── Story Playback
  │   ├── Narrator Settings
  │   └── Family Settings
  ├── AI Story Engine
  │   ├── Story Planner
  │   ├── Story Writer
  │   ├── Safety Precheck
  │   ├── Safety Postcheck
  │   ├── Scene Splitter
  │   ├── Emotional Adapter
  │   ├── Symbolic Motif Mapper
  │   └── Replay Manifest Builder
  ├── Media Engine
  │   ├── Web Speech Fallback
  │   ├── TTS Provider Adapter
  │   ├── Captions
  │   ├── Audio Assets
  │   └── Playback Timeline
  ├── Admin / Moderation
  │   ├── Flagged Content Queue
  │   ├── Safety Reviews
  │   ├── User Lookup
  │   ├── Story Inspection
  │   ├── Audit Logs
  │   └── System Health
  └── URAI Ecosystem Integration
      ├── URAI Auth
      ├── URAI Privacy
      ├── URAI Memory
      ├── URAI Companion
      ├── URAI Symbolic Engine
      ├── URAI Voice
      ├── URAI Admin
      └── URAI Analytics
```

## Phase 0 — Lock current demo
Goal: make sure nothing breaks.

Tasks:
- Run all scripts in a live checkout.
- Fix failing lint/typecheck/test/build/smoke checks only.
- Document current behavior.
- Add audit, roadmap, and definition-of-done docs.
- Do not introduce Firebase.
- Do not introduce AI provider integrations.
- Do not rewrite the app.

Exit criteria:
- Current demo runs.
- Build succeeds.
- Tests/smoke checks are understood.
- Demo behavior is documented.

## Phase 1 — TypeScript foundation
Goal: convert the demo into a scalable architecture while preserving behavior.

Implement:
- `/src/core/types`
- `/src/story-engine`
- `/src/safety`
- `/src/narration`
- `/src/storage`
- typed interfaces
- `LocalDemoStorage` adapter
- `LocalDemoStoryProvider`
- `LocalSafetyProvider`
- `WebSpeechNarrationProvider`

Tests:
- story creation
- safety rejection
- save/load/delete
- playback manifest creation

Exit criteria:
- All current flows still work.
- Core systems are modular.
- Local demo mode remains available.

## Phase 2 — Firebase backend
Goal: add production-ready cloud foundation while keeping local mode.

Implement:
- Firebase Auth
- Firestore
- Cloud Storage
- Cloud Functions scaffold
- Firebase emulator config
- Firestore security rules
- `.env.example`
- `docs/FIREBASE_SETUP.md`

Collections:
- `users`
- `families`
- `childProfiles`
- `parentSettings`
- `stories`
- `storyRuns`
- `storyScenes`
- `narrationJobs`
- `audioAssets`
- `safetyReviews`
- `moderationEvents`
- `adminAuditLogs`

Exit criteria:
- Family data is private by default.
- Stories can be saved to cloud in authenticated mode.
- Local demo mode still works.

## Phase 3 — AI story pipeline
Goal: build provider-based AI generation without vendor lock-in.

Pipeline:
1. Normalize request.
2. Safety precheck.
3. Generate story plan.
4. Generate story draft.
5. Safety postcheck.
6. Split into scenes.
7. Build playback manifest.
8. Save story run.
9. Return story.

Provider interfaces:
- `AIStoryProvider`
- `SafetyProvider`
- `NarrationProvider`
- `MemorySeedProvider`
- `SymbolicThemeProvider`

Exit criteria:
- Local provider and future AI provider share the same contract.
- Failed generations return safe fallback states.
- Safety events are logged.

## Phase 4 — Child safety hardening
Goal: make the system technically ready for serious family-safe operation.

Implement:
- age bands
- parent settings
- blocked themes
- allowed themes
- safety classifications
- moderation event logs
- output review
- manual review queue scaffold
- unsafe prompt UX
- unsafe output fallback
- admin visibility into safety events

Exit criteria:
- Unsafe input and unsafe output are handled.
- Parent settings influence generation.
- Legal review needs are documented without claiming compliance.

## Phase 5 — Narration and replay
Goal: create the premium playback layer.

Implement:
- `NarratorProfile`
- narration script generation
- Web Speech fallback
- TTS provider interface
- captions
- scene timing
- playback manifest
- bedtime mode
- replay controls
- audio asset tracking

Exit criteria:
- Stories can be replayed scene-by-scene.
- Captions work.
- Web Speech remains available as fallback.

## Phase 6 — Cinematic UI polish
Goal: make the product feel warm, magical, premium, family-safe, mobile-first, and accessible.

Pages:
- Landing
- Demo
- Create Story
- Story Playback
- Library
- Parent Dashboard
- Child Profiles
- Settings
- Safety
- Creators
- Pricing / Waitlist

Exit criteria:
- Mobile and tablet UX are polished.
- Loading, empty, error, and success states are designed.
- Accessibility pass is complete.

## Phase 7 — Admin and moderation
Goal: make StoryTime operable and governable.

Implement:
- admin role gate
- moderator role gate
- flagged story queue
- safety review dashboard
- story inspection
- user/family lookup
- generation job monitor
- audit logs
- system health

Exit criteria:
- Moderators can inspect flagged content.
- Admin actions are audit logged.
- System health is visible.

## Phase 8 — Website launch
Goal: prepare `www.uraistorytime.com` for professional launch.

Implement:
- SEO metadata
- Open Graph metadata
- favicon/app icons
- `sitemap.xml`
- `robots.txt`
- waitlist form
- contact form
- privacy page
- terms page
- child safety page
- demo flow
- analytics hook
- production deployment checklist

Exit criteria:
- Domain is live with SSL.
- Public website is polished.
- Demo and waitlist work.
- Legal placeholder pages exist pending legal review.

## Phase 9 — URAI ecosystem integration
Goal: keep StoryTime standalone while enabling modular integration with the broader URAI system.

Connect:
- URAI Auth
- URAI Privacy
- URAI Companion
- URAI Memory
- URAI Symbolic Engine
- URAI Voice
- URAI Analytics
- URAI Admin
- URAI Cloud Infrastructure

Exit criteria:
- Standalone mode still works.
- Ecosystem integrations are optional and modular.
- Shared privacy and admin controls are respected.
