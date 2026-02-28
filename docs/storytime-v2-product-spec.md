# URAI Storytime V2 - Product Specification (Phase 1: Ages 3-8)

**Version:** 1.0
**Date:** 2024-10-27
**Status:** Initial Draft

## 1. Overview

URAI Storytime V2 is a parent-guided magical story world designed to grow with a child, focused on wonder, safety, and emotional continuity. Phase 1 targets ages 3-8.

## 2. Core Philosophy

- **Parent as Director:** The app is a tool for parents to shape the narrative. It does not replace parental authority.
- **No Manipulation:** The product will not use dark patterns, addictive mechanics (streaks, points), or emotional manipulation.
- **No Profiling:** The system will not build psychological or behavioral profiles of minors.
- **Calm by Design:** The experience is intentionally paced to be calming and non-overstimulating.

## 3. Key Features (Phase 1: Ages 3-8)

### 3.1. The Living World (Visuals)

- **Engine:** Hybrid 2.5D layered world (e.g., using React with a lightweight library like Rive or simple parallax).
- **Ages 3-5:** The experience is contained *within* the pages of a magical book. The book's edges form a safe, visible boundary.
- **Ages 6-8:** The camera pulls back to show the book sitting *within* a larger world (e.g., a forest clearing). The child can glimpse this world, building curiosity.

### 3.2. The Daily Rhythm

The application operates in three distinct, parent-selectable modes based on time of day.

- **🌅 Morning Spark (2-3 mins):** A short, gentle story to prime a positive mindset. Minimal interaction.
- **☀️ Day Exploration (5-10 mins):** More interactive adventures with light, embedded learning (e.g., shape matching, counting). The child has more pacing control.
- **🌙 Night Wind-Down (5-15 mins):** A slow, calming ritual with minimal interaction. The narrator controls the pacing to help regulate the child's nervous system for sleep.

### 3.3. The Companion & Narrator

- **Companion:** A single, primary companion—a soft, non-verbal fantasy creature (e.g., a gentle dragon or spirit). It communicates through gestures and sounds, not full sentences. It grows subtly with the child.
- **Narrator:** A separate, optional narrator voice that handles the main storytelling and exposition. This separates the "friend" from the "storyteller."

### 3.4. Interaction Model

- **Invisible UI:** The interface is diegetic, integrated into the world itself (e.g., stories are pages in a book, settings are a hidden lantern).
- **Age-Appropriate Gestures:**
    - **Ages 3-5:** Primarily tapping and simple dragging.
    - **Ages 6-8:** Introduces more complex dragging and swiping.
- **No Failure States:** Interactions guide the story forward. There are no "wrong" answers, only different gentle outcomes.

### 3.5. Parent Dashboard

- **Access:** Hidden behind a secure gesture (e.g., tap-and-hold for 3 seconds) or PIN.
- **Controls:**
    - Select weekly themes (e.g., kindness, courage).
    - Set session time limits.
    - View non-invasive session history (stories completed).
    - Approve progression to the next age-stage (for future phases).

## 4. Content Specification (Phase 1)

- **IP:** All stories will be original intellectual property to ensure tonal and ethical consistency.
- **Structure:** Stories will be mostly linear with occasional, simple branching choices that reconverge to a safe conclusion.
- **Launch Volume:** Target 10-15 highly polished, replayable stories. Quality over quantity.

## 5. Technical Specification (Phase 1)

- **Backend:** Firebase (Firestore, Cloud Functions for V2, Cloud Storage).
- **Frontend:** Lightweight web framework (e.g., Next.js or Vite with React).
- **Visuals:** 2.5D rendering using layered assets and a simple animation library.
- **Database Schema:**
    - `families/{familyId}`
    - `families/{familyId}/children/{childId}` (ageStage, progressionLevel)
    - `storyTemplates/{templateId}` (ageStage, mode, theme)
    - `storySessions/{sessionId}` (logging)

## 6. Ethical Guardrails (The "No" List)

- **NO** behavioral profiling of minors.
- **NO** manipulative gamification (streaks, points, leaderboards).
- **NO** push notifications for children.
- **NO** direct social features between children.
- **NO** advertising or data monetization.
- **NO** data transfer from Storytime to profile for the adult URAI Core.

This document will serve as our guide. Now that the product is clearly defined, we can move on to the next step. Shall we proceed with drafting the **Foundation grant pitch narrative**?