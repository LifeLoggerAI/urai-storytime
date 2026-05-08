# URAI-StoryTime Phase 0 Audit

## Scope
This audit locks the current demo baseline for URAI-StoryTime and identifies what is present, partial, missing, broken, and risky before the 2.5+ system-of-systems implementation begins.

North Star: URAI-StoryTime should become a standalone, family-safe AI storytelling system that generates, narrates, replays, stores, moderates, and emotionally adapts personalized stories while integrating with URAI memory, narrator, symbolic, privacy, admin, and analytics systems.

## Verified current baseline

### Existing
- Public GitHub repository: `LifeLoggerAI/urai-storytime`.
- Static/demo web app served from `src/`.
- Vanilla HTML/CSS/JavaScript stack.
- Node built-in HTTP server for local preview.
- Static build script that copies top-level `src` files into `dist/`.
- Hash-based routes: Home, Create, Library, Story Detail, Settings.
- Story creation form with child name, theme, mood, narrator, and custom prompt.
- Local demo story generator in `src/story-engine.mjs`.
- Basic prompt moderation blocklist.
- Browser `localStorage` library under `urai_library`.
- Browser `SpeechSynthesisUtterance` narration.
- Copy/share, regenerate navigation, delete from library, empty library state, missing-story state.
- README with deployment and smoke checklist.

### Partial
- Product vision: current app is a bedtime story demo, not the full URAI-StoryTime 2.5+ platform.
- Story engine: deterministic local sentence template only; no AI planner, no provider architecture, no scene graph, no replay manifest.
- Safety: simple blocklist only; no age bands, post-generation moderation, parent policy model, review queue, audit trail, or legal compliance workflow.
- Narration: browser Web Speech only; no TTS jobs, audio files, captions, voice profiles, or timing metadata.
- Storage: browser-only localStorage; no user accounts, cloud sync, family library, deletion/export controls, or cross-device persistence.
- UX: basic hash app; not yet AAA/cinematic, no onboarding sequence, no child profile selector, no parent dashboard, no creator surface.
- Testing: scripts exist, but deeper coverage needs verification and expansion.
- Deployment: static host ready, but no verified production domain setup, CI/CD, monitoring, staging, or release gates.

### Missing
- Firebase/Auth or equivalent identity system.
- Parent/child/family data model.
- Firestore or persistent cloud database.
- Cloud Functions or backend API.
- Cloud Storage/audio asset pipeline.
- Provider-based AI story generation.
- Story planning, story writing, scene splitting, symbolic motif mapping, emotional adaptation, and replay manifest generation.
- TTS provider integration, captions, audio timing, narrator profiles, and bedtime playback mode.
- Admin dashboard, moderator roles, flagged content queue, safety review dashboard, audit logs, and system health.
- Creator dashboard, story pack builder, creator publishing workflow, and marketplace-ready data model.
- Website sitemap beyond current demo pages.
- SEO metadata, Open Graph, sitemap.xml, robots.txt, waitlist/contact forms, legal pages, analytics hook.
- Security rules, secrets handling, environment separation, CI/CD, observability, load testing, accessibility testing, and production launch checklist.

### Broken or not verified
- Full file tree was not available through the GitHub search connector in this session.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:smoke`, and `npm run build` were not executed in a live checkout in this phase.
- Live `www.uraistorytime.com` deployment was not verified in this environment.
- Test file inventory could not be fully verified from connector search results.

## Risk register

| Area | Risk | Level | Notes |
| --- | --- | --- | --- |
| Child safety | Current blocklist is not production moderation | Critical | Needs multi-stage safety classification, age bands, output review, and manual moderation. |
| Data persistence | localStorage only | High | Users lose stories across browsers/devices and no account-level privacy controls exist. |
| AI generation | No provider architecture | High | The app cannot support scalable AI storytelling until engine interfaces and orchestration exist. |
| Narration | Web Speech only | Medium | Good fallback, but not a premium controlled narrator/audio system. |
| Website launch | Domain not verified | High | `uraistorytime.com` requires deployment, SSL, SEO, legal pages, and analytics. |
| Compliance | Child/family product with no formal controls | Critical | Requires legal review and technical privacy/safety implementation. |
| Testing | Coverage unknown | Medium | Add unit, integration, e2e, safety, accessibility, and deployment tests. |
| Architecture | Flat vanilla demo | Medium | Fine for MVP, but needs modular TypeScript/Firebase architecture for 2.5+. |

## Phase 0 recommendation
Do not introduce Firebase, AI providers, paid TTS, or a rewrite until the current demo is verified in a local checkout. Preserve the demo as the fallback/local mode and proceed next with a TypeScript domain-model foundation.
