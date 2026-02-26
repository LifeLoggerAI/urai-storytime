# Storytime V2 (Kids' Generational World) - Technical Roadmap

This document outlines the phased technical roadmap for Storytime V2. Development is contingent on the completion of URAI Core.

## Phase 1: Infrastructure Foundation (Month 1 Post-Core)

### 1. Data Architecture
- **Collections:** `families`, `children`, `storyTemplates`, `storySessions`, `progressionState`.
- **Fields:** `ageStage`, `dailyState`, `progressionLevel`, `unlockFlags`, `calmPreference`.

### 2. Secure Function Layer
- **Function:** `generateStoryV2`
- **Logic:** Ownership validation, daily caps, age/mode filtering, 1-hour signed URLs.

### 3. Rhythm Engine
- **State:** `child.dailyState` (`lastMode`, `storyCountToday`, `lastStoryTime`).
- **Rules:** Max 3 sessions/day, night mode slows pacing, no infinite replay.

## Phase 2: Experience Layer (Month 2-3)

### 4. Frontend Framework
- **Technology:** Lightweight React or Next.js.
- **Design:** 2.5D layered book environment, low animation load, calm visual tone.

### 5. Age Segmentation
- **Ages 3-5:** Inside book only, minimal interaction (shape/color/sound), short stories (2-4 min).
- **Ages 6-8:** World expands around book, light branching choices, longer stories (4-7 min).

### 6. Parent Layer
- **Dashboard:** View session history, approve unlocks, adjust age stage, delete data, night mode toggle.

## Phase 3: Companion System (Month 4)

- **Creature:** Non-verbal, subtle growth scaling, never instructional.

## Phase 4: Guardrails & Compliance (Month 5)

- Formal compliance audit (COPPA).
- Third-party privacy review.
- Public-facing documentation site.

## Phase 5: Public Launch (Month 6)

- **Branding:** "Storytime by URAI Labs"
- **Positioning:** Calm, safe, parent-first, no manipulation.
