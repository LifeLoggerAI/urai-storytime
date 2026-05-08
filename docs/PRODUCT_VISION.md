# URAI-StoryTime Product Vision

## North Star
URAI-StoryTime is a standalone, family-safe AI storytelling platform that generates, narrates, replays, stores, moderates, and emotionally adapts personalized stories while integrating with URAI memory, narrator, symbolic, privacy, admin, voice, and analytics systems.

The product should feel magical, calm, emotionally intelligent, privacy-first, and trustworthy enough for families while being architected like a durable platform.

## Current baseline
The current repo is a lightweight local demo:
- Vanilla HTML/CSS/JavaScript.
- Local story generation.
- Browser localStorage story library.
- Browser Web Speech narration.
- Basic blocklist moderation.
- Static deploy posture.

This baseline is useful as a working demo and fallback mode, but it is not the final 2.5+ product.

## Final product identity
URAI-StoryTime is not just a bedtime story generator. It is the narrative layer of the URAI ecosystem: a system that turns safe user context, family preferences, emotional tone, symbolic themes, and optional memory seeds into cinematic stories with narration and replay.

## Core product pillars

### 1. Family-safe storytelling
Parents should be able to create safe, age-aware stories for children with clear controls, transparent safety behavior, and private-by-default storage.

### 2. Cinematic narration
Stories should not only be text. They should become narrated, captioned, scene-based experiences with bedtime mode, replay mode, and consistent narrator personalities.

### 3. Emotional adaptation
Story tone should adapt to selected mood, bedtime context, user preferences, and future URAI emotional signals when explicitly enabled.

### 4. Symbolic intelligence
Stories should include motifs, archetypes, emotional lessons, and recurring symbols in a controlled, family-safe way.

### 5. Memory-aware replay
Optional family-safe memory seeds can be transformed into fictionalized, gentle stories. The system must avoid exposing sensitive or unsafe personal data.

### 6. Creator ecosystem
Creators should eventually build story packs, characters, themes, narrator styles, and world templates that can be reviewed, approved, and published.

### 7. Admin and moderation
A family/child-facing AI product needs a real operational layer: safety review queue, audit logs, flagged content review, system health, and role-gated admin tools.

### 8. Standalone plus URAI-integrated
URAI-StoryTime must work independently at `www.uraistorytime.com`, but also integrate cleanly with URAI Auth, Privacy, Memory, Companion, Voice, Admin, Analytics, and Symbolic systems.

## Primary users

### Parent
- Creates child profiles.
- Sets age bands and safety preferences.
- Generates stories.
- Manages library and privacy settings.
- Reviews story history.

### Child / Listener
- Experiences stories through a safe, magical, calm interface.
- Selects gentle themes with parent-approved boundaries.
- Replays favorite stories.

### Creator
- Builds story packs, characters, worlds, and themes.
- Previews generated experiences.
- Submits content for review.

### Admin
- Oversees users, safety events, moderation queue, analytics, and system health.

### Moderator
- Reviews flagged prompts, generated stories, creator submissions, and unsafe outputs.

### Partner / API consumer
- Eventually uses StoryTime generation, narration, or replay APIs under strict safety and privacy constraints.

## Final core experiences

### Public website
- Magical hero and demo.
- Parent trust messaging.
- Safety and privacy explanation.
- Sample story playback.
- Creator/publisher page.
- Waitlist/pricing.
- Legal pages.

### Parent onboarding
- Create account.
- Create family profile.
- Add child profile.
- Select age band.
- Choose safety settings.
- Pick narrator style.
- Generate first story.

### Story creation
- Choose child profile.
- Choose story theme.
- Choose mood.
- Choose narrator.
- Optional memory seed.
- Safety precheck.
- Generate story.
- Review and play.

### Story playback
- Scene cards.
- Narration.
- Captions.
- Bedtime mode.
- Replay controls.
- Save/share controls.
- Regenerate safely.

### Creator studio
- Story pack builder.
- Character builder.
- World/theme templates.
- Safety constraints.
- Preview.
- Submit for approval.

### Admin operations
- Safety review queue.
- Moderation dashboard.
- Audit logs.
- Job monitoring.
- Story inspection.
- User/family lookup with access controls.

## Product principles
- Safe before magical.
- Private by default.
- Parent controlled.
- Child-centered, not engagement-maximized.
- Calm over addictive.
- Transparent boundaries.
- Provider-agnostic architecture.
- Local demo fallback preserved.
- No hidden data collection.
- Legal compliance is reviewed by qualified counsel, not assumed.

## Version 2.5+ target
Version 2.5+ should be the first serious platform version:
- Authenticated app.
- Family profiles.
- Cloud library.
- Safety pipeline.
- Modular AI story engine.
- Narration and replay foundation.
- Public website.
- Admin/moderation scaffold.
- CI/CD and production deployment gates.

## Future expansion
- Story packs marketplace.
- Creator revenue share.
- School/library edition.
- Premium narrator voices.
- Companion continuity.
- Memory constellation replay.
- Multi-language generation.
- Accessibility-first audio/visual modes.
- Family legacy story archive.
