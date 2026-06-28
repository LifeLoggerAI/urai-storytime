"use client";

import { httpsCallable } from "firebase/functions";
import { FormEvent, useMemo, useState } from "react";
import { getFirebaseAuth, getFirebaseFunctions, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import { AuthPanel } from "./AuthPanel";
import { SessionLibrary } from "./SessionLibrary";

const MAX_DEMO_SOURCE_CHARS = 1200;
const AGE_RANGES = ["3-5", "6-8", "9-12", "family"] as const;
const MOODS = ["gentle", "reflective", "playful", "brave", "calm"] as const;
const SAFETY_TERMS = ["self harm", "harm", "weapon", "explicit", "abuse"];

type GenerateStoryResponse = {
  sessionId?: string;
  status?: string;
  safetyStatus?: string;
};

function firstUnsafeTerm(values: string[]) {
  const text = values.join(" ").toLowerCase();
  return SAFETY_TERMS.find((term) => text.includes(term));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Story creation failed. Please try again.";
}

export function StorytimeHome() {
  const [title, setTitle] = useState("A Quiet Signal Became a Story");
  const [theme, setTheme] = useState("quiet signal");
  const [ageRange, setAgeRange] = useState<(typeof AGE_RANGES)[number]>("family");
  const [mood, setMood] = useState<(typeof MOODS)[number]>("reflective");
  const [sourceText, setSourceText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cloudReady = isStorytimeCloudModeEnabled();

  const validationError = useMemo(() => {
    if (!title.trim()) return "A story title is required.";
    if (!theme.trim()) return "A theme is required.";
    if (!AGE_RANGES.includes(ageRange)) return "Choose a supported age range.";
    const unsafeTerm = firstUnsafeTerm([title, theme, mood, sourceText]);
    if (unsafeTerm) return `Remove sensitive term before continuing: ${unsafeTerm}.`;
    if (sourceText.length > MAX_DEMO_SOURCE_CHARS) return `Keep source text under ${MAX_DEMO_SOURCE_CHARS} characters for this UI.`;
    return null;
  }, [ageRange, mood, sourceText, theme, title]);

  function openDemoSession() {
    const cleanTitle = title.trim() || "Untitled Story Session";
    const cleanSource = sourceText.trim().slice(0, MAX_DEMO_SOURCE_CHARS);
    const params = new URLSearchParams({ title: cleanTitle, theme: theme.trim(), ageRange, mood });

    if (cleanSource) params.set("source", cleanSource);

    window.location.assign(`/storytime/demo?${params.toString()}`);
  }

  async function handleCreateStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    if (!cloudReady) {
      openDemoSession();
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      setSubmitError("Create Story requires a signed-in Firebase user. Demo mode remains available without an account.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createStory = httpsCallable<Record<string, unknown>, GenerateStoryResponse>(getFirebaseFunctions(), "generateStorySession");
      const result = await createStory({
        title: title.trim(),
        sourceText: sourceText.trim().slice(0, MAX_DEMO_SOURCE_CHARS),
        emotionalTone: mood,
        symbolicMotifs: [theme.trim()],
        sourceSignals: ["storytime form"],
        ageRange,
        theme: theme.trim(),
        consentSnapshot: {
          storyGeneration: true,
          voiceover: false,
          publicSharing: false,
          memoryUse: false
        }
      });

      if (!result.data.sessionId) throw new Error("Story provider returned no session id.");
      window.location.assign(`/storytime/${encodeURIComponent(result.data.sessionId)}`);
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="storytime-shell">
      <div className="storytime-wrap">
        <nav className="storytime-nav">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links"><a href="/storytime/settings">Settings</a></div>
        </nav>

        <section className="storytime-hero">
          <p className="storytime-eyebrow">URAI Narrative Engine</p>
          <h1 className="storytime-title">Your life signals, shaped into private story replays.</h1>
          <p className="storytime-subtitle">Storytime turns opted-in URAI memories, moods, rituals, relationship threads, and timeline moments into gentle chapters, narrator scripts, emotional arcs, and shareable storycards.</p>
        </section>

        <section className="storytime-grid" aria-label="Storytime values">
          {[
            ["Private by default", "Stories stay private unless you explicitly create a public-safe share."],
            ["Narrator-ready", "Every chapter can become a warm, grounded narrator script."],
            ["System-aware", "Designed to connect with URAI mood, memory, ritual, timeline, and companion layers."]
          ].map(([heading, body]) => (
            <article key={heading} className="storytime-card"><h2>{heading}</h2><p>{body}</p></article>
          ))}
        </section>

        <section className="storytime-grid compact" aria-label="Storytime cloud account and library">
          <AuthPanel />
          <SessionLibrary />
        </section>

        <form className="storytime-card storytime-form" onSubmit={handleCreateStory}>
          <p className="storytime-pill">{cloudReady ? "Cloud mode configured" : "Demo mode"}</p>
          <h2>Create a private story seed</h2>
          {!cloudReady ? <p className="storytime-warning">Cloud generation unavailable. This form opens a labeled deterministic demo until Firebase client env vars, auth, provider readiness, and NEXT_PUBLIC_STORYTIME_CLOUD_MODE=true are configured.</p> : null}
          <label className="storytime-field">Story title<input className="storytime-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} /></label>
          <label className="storytime-field">Theme<input className="storytime-input" value={theme} onChange={(event) => setTheme(event.target.value)} maxLength={80} placeholder="gentle adventure, family memory, quiet signal" /></label>
          <div className="storytime-grid compact">
            <label className="storytime-field">Age range<select className="storytime-input" value={ageRange} onChange={(event) => setAgeRange(event.target.value as (typeof AGE_RANGES)[number])}>{AGE_RANGES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="storytime-field">Mood<select className="storytime-input" value={mood} onChange={(event) => setMood(event.target.value as (typeof MOODS)[number])}>{MOODS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
          <label className="storytime-field">Optional source text<textarea className="storytime-input" rows={6} value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste a private moment, weekly reflection, or story seed. Avoid names, addresses, phone numbers, school names, or other sensitive personal details." /></label>
          {submitError ? <p className="storytime-error">{submitError}</p> : null}
          {validationError ? <p className="storytime-helper">{validationError}</p> : null}
          <div className="storytime-actions">
            <button className="storytime-button" type="submit" disabled={Boolean(validationError) || isSubmitting}>{cloudReady ? (isSubmitting ? "Creating..." : "Create Story") : "Open Demo Story Session"}</button>
            {cloudReady ? <button className="storytime-button secondary" type="button" onClick={openDemoSession}>Use demo instead</button> : null}
          </div>
          <p className="storytime-helper">Demo mode is local and deterministic. Cloud mode requires Firebase Auth plus a real provider configured in Functions; provider failures are shown without saving partial personal data.</p>
        </form>
      </div>
    </main>
  );
}
