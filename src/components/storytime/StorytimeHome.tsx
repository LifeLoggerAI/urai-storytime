"use client";

import { httpsCallable } from "firebase/functions";
import { FormEvent, useMemo, useState } from "react";
import { getFirebaseAuth, getFirebaseFunctions, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import { AuthPanel } from "./AuthPanel";
import { SessionLibrary } from "./SessionLibrary";

const MAX_SOURCE_CHARS = 1200;
const AGE_RANGES = ["3-5", "6-8", "9-12", "family"] as const;
const MOODS = ["gentle", "reflective", "playful", "brave", "calm"] as const;
const SAFETY_TERMS = ["self harm", "weapon", "explicit abuse"];

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
  return error instanceof Error ? error.message : "Story creation was interrupted. Please try again.";
}

export function StorytimeHome() {
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [ageRange, setAgeRange] = useState<(typeof AGE_RANGES)[number]>("family");
  const [mood, setMood] = useState<(typeof MOODS)[number]>("reflective");
  const [sourceText, setSourceText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cloudReady = isStorytimeCloudModeEnabled();

  const validationError = useMemo(() => {
    if (!title.trim()) return "Add a title to continue.";
    if (!theme.trim()) return "Add a theme to continue.";
    if (!AGE_RANGES.includes(ageRange)) return "Choose an age range.";
    const unsafeTerm = firstUnsafeTerm([title, theme, mood, sourceText]);
    if (unsafeTerm) return "This story seed includes sensitive content that Storytime cannot process here.";
    if (sourceText.length > MAX_SOURCE_CHARS) return `Keep the source text under ${MAX_SOURCE_CHARS} characters.`;
    return null;
  }, [ageRange, mood, sourceText, theme, title]);

  async function handleCreateStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!cloudReady) {
      setSubmitError("Story creation is temporarily unavailable. Your text has not been submitted.");
      return;
    }

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      setSubmitError("Sign in to create and save a private story.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createStory = httpsCallable<Record<string, unknown>, GenerateStoryResponse>(getFirebaseFunctions(), "generateStorySession");
      const result = await createStory({
        title: title.trim(),
        sourceText: sourceText.trim().slice(0, MAX_SOURCE_CHARS),
        emotionalTone: mood,
        symbolicMotifs: [theme.trim()],
        sourceSignals: ["storytime form"],
        ageRange,
        theme: theme.trim(),
        consentSnapshot: {
          storyGeneration: true,
          voiceover: false,
          publicSharing: false,
          memoryUse: false,
        },
      });

      if (!result.data.sessionId) throw new Error("Story creation did not complete.");
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
        <nav className="storytime-nav" aria-label="Storytime">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links"><a href="/storytime/settings">Settings</a></div>
        </nav>

        <section className="storytime-hero">
          <p className="storytime-eyebrow">Stories from the life you already lived</p>
          <h1 className="storytime-title">Turn a memory into something you can return to.</h1>
          <p className="storytime-subtitle">Storytime can shape the memories and reflections you choose into private chapters with a gentler narrative form. Nothing is shared unless you choose to share it.</p>
        </section>

        <section className="storytime-grid" aria-label="How Storytime works">
          {[
            ["Private first", "Your story remains private unless you explicitly create a shareable version."],
            ["Grounded in your words", "Storytime starts with the memory, theme, and tone you choose rather than inventing a life for you."],
            ["Made to revisit", "Created stories can live alongside your other Storytime sessions so meaningful moments are easy to find again."],
          ].map(([heading, body]) => (
            <article key={heading} className="storytime-card"><h2>{heading}</h2><p>{body}</p></article>
          ))}
        </section>

        <section className="storytime-grid compact" aria-label="Account and story library">
          <AuthPanel />
          <SessionLibrary />
        </section>

        <form className="storytime-card storytime-form" onSubmit={handleCreateStory} aria-describedby={!cloudReady ? "storytime-unavailable" : undefined}>
          <p className="storytime-pill">Private story</p>
          <h2>Create a story</h2>
          <p>Choose the details you want Storytime to use. You can keep the source brief—a few lines are enough.</p>

          {!cloudReady ? (
            <p className="storytime-warning" id="storytime-unavailable" role="status">
              Story creation is temporarily unavailable. You can still review your saved stories and settings.
            </p>
          ) : null}

          <label className="storytime-field">
            Title
            <input className="storytime-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} autoComplete="off" />
          </label>
          <label className="storytime-field">
            Theme
            <input className="storytime-input" value={theme} onChange={(event) => setTheme(event.target.value)} maxLength={80} placeholder="A family memory, a quiet turning point, a brave day" autoComplete="off" />
          </label>
          <div className="storytime-grid compact">
            <label className="storytime-field">
              Audience
              <select className="storytime-input" value={ageRange} onChange={(event) => setAgeRange(event.target.value as (typeof AGE_RANGES)[number])}>
                <option value="family">Family</option>
                <option value="3-5">Ages 3–5</option>
                <option value="6-8">Ages 6–8</option>
                <option value="9-12">Ages 9–12</option>
              </select>
            </label>
            <label className="storytime-field">
              Tone
              <select className="storytime-input" value={mood} onChange={(event) => setMood(event.target.value as (typeof MOODS)[number])}>
                {MOODS.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
              </select>
            </label>
          </div>
          <label className="storytime-field">
            Memory or source text <span className="storytime-helper">Optional</span>
            <textarea className="storytime-input" rows={6} value={sourceText} maxLength={MAX_SOURCE_CHARS} onChange={(event) => setSourceText(event.target.value)} placeholder="Add the part of the memory you want the story to hold onto." />
          </label>

          {submitError ? <p className="storytime-error" role="alert">{submitError}</p> : null}
          {cloudReady && validationError ? <p className="storytime-helper">{validationError}</p> : null}

          <div className="storytime-actions">
            <button className="storytime-button" type="submit" disabled={!cloudReady || Boolean(validationError) || isSubmitting}>
              {isSubmitting ? "Creating story…" : "Create story"}
            </button>
          </div>
          <p className="storytime-helper">Storytime only submits the information in this form after you choose Create story.</p>
        </form>
      </div>
    </main>
  );
}
