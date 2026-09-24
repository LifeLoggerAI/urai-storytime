"use client";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth, getFirebaseDb, getFirebaseFunctions, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import { AuthPanel } from "./AuthPanel";
import { DraftLibrary } from "./DraftLibrary";
import { SessionLibrary } from "./SessionLibrary";

const MAX_SOURCE_CHARS = 1200;
const AUDIENCE_AGE_BANDS = ["family", "preschool_3_5", "early_reader_6_8", "middle_grade_9_12"] as const;
const STORY_GENERATION_CONSENT_VERSION = "story-generation-consent-v1";
const STORY_REQUEST_REVIEW_VERSION = "story-request-review-v1";
const DRAFT_STORAGE_CONSENT_VERSION = "story-draft-storage-v1";
const MOODS = ["gentle", "reflective", "playful", "brave", "calm"] as const;
const SAFETY_TERMS = ["self harm", "weapon", "explicit abuse"];

type GenerateStoryResponse = {
  sessionId?: string;
  status?: string;
  safetyStatus?: string;
};

type SaveDraftResponse = {
  draftId?: string;
  revision?: number;
  updatedAt?: string;
  retentionReviewAt?: string;
};

function firstUnsafeTerm(values: string[]) {
  const text = values.join(" ").toLowerCase();
  return SAFETY_TERMS.find((term) => text.includes(term));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Story creation was interrupted. Please try again.";
}

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `story-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function createDraftId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `draft-${crypto.randomUUID()}`;
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function validDraftId(value: string) {
  return /^[A-Za-z0-9._-]{8,128}$/.test(value);
}

function draftFingerprint(input: {
  title: string;
  theme: string;
  audienceAgeBand: string;
  mood: string;
  sourceText: string;
}) {
  return JSON.stringify({
    title: input.title.trim(),
    theme: input.theme.trim(),
    audienceAgeBand: input.audienceAgeBand,
    mood: input.mood,
    sourceText: input.sourceText.trim(),
    locale: "en-US"
  });
}

export function StorytimeHome() {
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [audienceAgeBand, setAudienceAgeBand] = useState<(typeof AUDIENCE_AGE_BANDS)[number]>("family");
  const [mood, setMood] = useState<(typeof MOODS)[number]>("reflective");
  const [sourceText, setSourceText] = useState("");
  const [adultGuardianAffirmed, setAdultGuardianAffirmed] = useState(false);
  const [generationConsent, setGenerationConsent] = useState(false);
  const [providerProcessingConsent, setProviderProcessingConsent] = useState(false);
  const [reviewedFingerprint, setReviewedFingerprint] = useState<string | null>(null);
  const [draftStorageConsent, setDraftStorageConsent] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftRevision, setDraftRevision] = useState(0);
  const [lastSavedDraftFingerprint, setLastSavedDraftFingerprint] = useState<string | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cloudReady = isStorytimeCloudModeEnabled();

  const currentDraftFingerprint = useMemo(() => draftFingerprint({
    title,
    theme,
    audienceAgeBand,
    mood,
    sourceText
  }), [audienceAgeBand, mood, sourceText, theme, title]);

  useEffect(() => {
    if (!cloudReady || typeof window === "undefined") return undefined;
    const requestedDraftId = new URLSearchParams(window.location.search).get("draft");
    if (!requestedDraftId) return undefined;
    if (!validDraftId(requestedDraftId)) {
      setDraftStatus("The requested private draft id is invalid.");
      return undefined;
    }

    let active = true;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!active || !user) return;
      try {
        const snapshot = await getDoc(doc(getFirebaseDb(), "storyDrafts", requestedDraftId));
        if (!active) return;
        if (!snapshot.exists()) {
          setDraftStatus("That private draft is unavailable.");
          return;
        }
        const data = snapshot.data();
        setTitle(typeof data.title === "string" ? data.title : "");
        setTheme(typeof data.theme === "string" ? data.theme : "");
        setAudienceAgeBand(AUDIENCE_AGE_BANDS.includes(data.audienceAgeBand) ? data.audienceAgeBand : "family");
        setMood(MOODS.includes(data.emotionalTone) ? data.emotionalTone : "reflective");
        setSourceText(typeof data.sourceText === "string" ? data.sourceText.slice(0, MAX_SOURCE_CHARS) : "");
        setAdultGuardianAffirmed(false);
        setGenerationConsent(false);
        setProviderProcessingConsent(false);
        setReviewedFingerprint(null);
        setDraftStorageConsent(true);
        setDraftId(snapshot.id);
        setDraftRevision(Number(data.revision || 0));
        setLastSavedDraftFingerprint(draftFingerprint({
          title: typeof data.title === "string" ? data.title : "",
          theme: typeof data.theme === "string" ? data.theme : "",
          audienceAgeBand: AUDIENCE_AGE_BANDS.includes(data.audienceAgeBand) ? data.audienceAgeBand : "family",
          mood: MOODS.includes(data.emotionalTone) ? data.emotionalTone : "reflective",
          sourceText: typeof data.sourceText === "string" ? data.sourceText.slice(0, MAX_SOURCE_CHARS) : ""
        }));
        setDraftStatus("Private draft resumed. Generation and provider consent were not restored.");
      } catch {
        if (active) setDraftStatus("That private draft could not be loaded.");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [cloudReady]);

  useEffect(() => {
    if (!cloudReady || !draftStorageConsent || draftSaving) return undefined;
    if (currentDraftFingerprint === lastSavedDraftFingerprint) return undefined;
    if (!title.trim() && !theme.trim() && !sourceText.trim()) return undefined;

    const user = getFirebaseAuth().currentUser;
    if (!user || !user.emailVerified) return undefined;

    const fingerprintAtSave = currentDraftFingerprint;
    const idAtSave = draftId || createDraftId();
    const expectedRevision = draftId ? draftRevision : 0;

    const timer = window.setTimeout(async () => {
      setDraftSaving(true);
      setDraftStatus("Saving private draft…");
      try {
        const saveDraft = httpsCallable<Record<string, unknown>, SaveDraftResponse>(
          getFirebaseFunctions(),
          "saveStoryDraft"
        );
        const result = await saveDraft({
          draftId: idAtSave,
          expectedRevision,
          title: title.slice(0, 120),
          theme: theme.slice(0, 80),
          sourceText: sourceText.slice(0, MAX_SOURCE_CHARS),
          emotionalTone: mood,
          audienceAgeBand,
          locale: "en-US",
          storageConsent: {
            privateDraftStorage: true,
            consentVersion: DRAFT_STORAGE_CONSENT_VERSION
          }
        });
        if (!result.data.draftId || typeof result.data.revision !== "number") {
          throw new Error("Draft save did not return a revision.");
        }
        setDraftId(result.data.draftId);
        setDraftRevision(result.data.revision);
        setLastSavedDraftFingerprint(fingerprintAtSave);
        setDraftStatus(`Private draft saved · revision ${result.data.revision}. Generation/provider consent is not stored.`);
      } catch {
        setDraftStatus("Private draft autosave paused. No provider request was made.");
      } finally {
        setDraftSaving(false);
      }
    }, 750);

    return () => window.clearTimeout(timer);
  }, [
    audienceAgeBand,
    cloudReady,
    currentDraftFingerprint,
    draftId,
    draftRevision,
    draftSaving,
    draftStorageConsent,
    lastSavedDraftFingerprint,
    mood,
    sourceText,
    theme,
    title
  ]);

  const requestReviewFingerprint = useMemo(() => JSON.stringify({
    title: title.trim(),
    theme: theme.trim(),
    audienceAgeBand,
    mood,
    sourceText: sourceText.trim(),
    adultGuardianAffirmed,
    generationConsent,
    providerProcessingConsent,
    locale: "en-US"
  }), [
    adultGuardianAffirmed,
    audienceAgeBand,
    generationConsent,
    mood,
    providerProcessingConsent,
    sourceText,
    theme,
    title
  ]);
  const requestReviewed = reviewedFingerprint === requestReviewFingerprint;

  const validationError = useMemo(() => {
    if (!title.trim()) return "Add a title to continue.";
    if (!theme.trim()) return "Add a theme to continue.";
    if (!AUDIENCE_AGE_BANDS.includes(audienceAgeBand)) return "Choose an audience age band.";
    if (!adultGuardianAffirmed) return "Storytime is currently adult/guardian-operated. Confirm that you are the adult or guardian operating this story.";
    if (!generationConsent) return "Explicit story-generation consent is required.";
    if (!providerProcessingConsent) return "Consent to the configured story-generation provider is required before cloud generation.";
    if (!requestReviewed) return "Review the exact Storytime request before generation.";
    const unsafeTerm = firstUnsafeTerm([title, theme, mood, sourceText]);
    if (unsafeTerm) return "This story seed includes sensitive content that Storytime cannot process here.";
    if (sourceText.length > MAX_SOURCE_CHARS) return `Keep the source text under ${MAX_SOURCE_CHARS} characters.`;
    return null;
  }, [adultGuardianAffirmed, audienceAgeBand, generationConsent, mood, providerProcessingConsent, requestReviewed, sourceText, theme, title]);

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
    if (!auth.currentUser.emailVerified) {
      setSubmitError("Verify the adult/guardian account email before creating a cloud story.");
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
        requestId: createRequestId(),
        locale: "en-US",
        sourceSignals: ["storytime form"],
        audienceAgeBand,
        operator: {
          role: "adult_or_guardian",
          affirmed: adultGuardianAffirmed,
        },
        requestReview: {
          reviewed: requestReviewed,
          reviewVersion: STORY_REQUEST_REVIEW_VERSION,
        },
        consentSnapshot: {
          storyGeneration: generationConsent,
          providerProcessing: providerProcessingConsent,
          consentVersion: STORY_GENERATION_CONSENT_VERSION,
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
              <select className="storytime-input" value={audienceAgeBand} onChange={(event) => setAudienceAgeBand(event.target.value as (typeof AUDIENCE_AGE_BANDS)[number])}>
                <option value="family">Family / general</option>
                <option value="preschool_3_5">Ages 3–5</option>
                <option value="early_reader_6_8">Ages 6–8</option>
                <option value="middle_grade_9_12">Ages 9–12</option>
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

          <label className="storytime-field">
            <span>
              <input
                type="checkbox"
                checked={adultGuardianAffirmed}
                onChange={(event) => setAdultGuardianAffirmed(event.target.checked)}
              />{" "}
              I confirm that I am the adult or guardian operating this Storytime request.
            </span>
          </label>
          <label className="storytime-field">
            <span>
              <input
                type="checkbox"
                checked={generationConsent}
                onChange={(event) => setGenerationConsent(event.target.checked)}
              />{" "}
              I consent to Storytime using the information in this form to create this private story.
            </span>
          </label>
          <label className="storytime-field">
            <span>
              <input
                type="checkbox"
                checked={providerProcessingConsent}
                onChange={(event) => setProviderProcessingConsent(event.target.checked)}
              />{" "}
              I consent to the configured story-generation provider processing the information in this form for this request.
            </span>
          </label>

          <section className="storytime-card storytime-stack" aria-label="Review Storytime request">
            <p className="storytime-pill">Review before generation</p>
            <h3>Confirm exactly what Storytime will use</h3>
            <dl>
              <dt>Title</dt><dd>{title.trim() || "Not provided"}</dd>
              <dt>Theme</dt><dd>{theme.trim() || "Not provided"}</dd>
              <dt>Audience</dt><dd>{audienceAgeBand}</dd>
              <dt>Tone</dt><dd>{mood}</dd>
              <dt>Locale</dt><dd>English (en-US)</dd>
              <dt>Source text</dt><dd>{sourceText.trim() ? `${sourceText.trim().length} characters` : "No optional source text"}</dd>
              <dt>Memory integration</dt><dd>Off</dd>
              <dt>Public sharing</dt><dd>Off</dd>
              <dt>Voiceover</dt><dd>Off</dd>
            </dl>
            <p className="storytime-helper">
              Changing any field after this confirmation automatically invalidates the review and requires a new confirmation.
            </p>
            <label className="storytime-field">
              <span>
                <input
                  type="checkbox"
                  checked={requestReviewed}
                  onChange={(event) => setReviewedFingerprint(event.target.checked ? requestReviewFingerprint : null)}
                />{" "}
                I reviewed this exact request and want Storytime to use only the information shown above for this generation.
              </span>
            </label>
          </section>

          {submitError ? <p className="storytime-error" role="alert">{submitError}</p> : null}
          {cloudReady && validationError ? <p className="storytime-helper">{validationError}</p> : null}

          <div className="storytime-actions">
            <button className="storytime-button" type="submit" disabled={!cloudReady || Boolean(validationError) || isSubmitting}>
              {isSubmitting ? "Creating story…" : "Create story"}
            </button>
          </div>
          <p className="storytime-helper">
            Storytime is currently adult/guardian-operated. Audience age bands shape the requested story; they do not create or authorize a child account.
            Nothing is submitted until you affirm the operator boundary, give the generation/provider consents above, and choose Create story.
          </p>
        </form>
      </div>
    </main>
  );
}
