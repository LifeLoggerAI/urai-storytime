"use client";

import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth, getFirebaseFunctions, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import { AuthPanel } from "./AuthPanel";
import { SessionLibrary } from "./SessionLibrary";

const MAX_SOURCE_CHARS = 1200;
const AUDIENCE_AGE_BANDS = ["family", "preschool_3_5", "early_reader_6_8", "middle_grade_9_12"] as const;
const STORY_GENERATION_CONSENT_VERSION = "story-generation-consent-v1";
const STORY_DRAFT_STORAGE_CONSENT_VERSION = "storytime-draft-storage-consent-v1";
const MOODS = ["gentle", "reflective", "playful", "brave", "calm"] as const;
const SAFETY_TERMS = ["self harm", "weapon", "explicit abuse"];

type StoryStep = "details" | "review";

type GenerateStoryResponse = {
  sessionId?: string;
  status?: string;
  safetyStatus?: string;
};

type DraftResponse = {
  status?: string;
  updatedAt?: string;
  expiresAt?: string;
};

type GetDraftResponse = {
  status?: string;
  draft?: {
    title?: string;
    theme?: string;
    audienceAgeBand?: (typeof AUDIENCE_AGE_BANDS)[number];
    mood?: (typeof MOODS)[number];
    sourceText?: string;
    locale?: string;
    draftStorageConsent?: boolean;
    draftStorageConsentVersion?: string;
    updatedAt?: string | null;
    expiresAt?: string | null;
  } | null;
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

function audienceLabel(value: (typeof AUDIENCE_AGE_BANDS)[number]) {
  if (value === "preschool_3_5") return "Ages 3–5";
  if (value === "early_reader_6_8") return "Ages 6–8";
  if (value === "middle_grade_9_12") return "Ages 9–12";
  return "Family / general";
}

export function StorytimeHome() {
  const [step, setStep] = useState<StoryStep>("details");
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [audienceAgeBand, setAudienceAgeBand] = useState<(typeof AUDIENCE_AGE_BANDS)[number]>("family");
  const [mood, setMood] = useState<(typeof MOODS)[number]>("reflective");
  const [sourceText, setSourceText] = useState("");
  const [adultGuardianAffirmed, setAdultGuardianAffirmed] = useState(false);
  const [generationConsent, setGenerationConsent] = useState(false);
  const [providerProcessingConsent, setProviderProcessingConsent] = useState(false);
  const [draftStorageConsent, setDraftStorageConsent] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cloudReady = isStorytimeCloudModeEnabled();

  useEffect(() => {
    if (!cloudReady) return undefined;

    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      const verified = Boolean(user?.emailVerified);
      setVerifiedUser(verified);
      if (!verified || draftLoaded) return;

      try {
        const getDraft = httpsCallable<Record<string, never>, GetDraftResponse>(
          getFirebaseFunctions(),
          "getStoryDraft"
        );
        const result = await getDraft({});
        const draft = result.data.draft;
        if (result.data.status === "ready" && draft) {
          setTitle(draft.title ?? "");
          setTheme(draft.theme ?? "");
          if (draft.audienceAgeBand && AUDIENCE_AGE_BANDS.includes(draft.audienceAgeBand)) {
            setAudienceAgeBand(draft.audienceAgeBand);
          }
          if (draft.mood && MOODS.includes(draft.mood)) setMood(draft.mood);
          setSourceText((draft.sourceText ?? "").slice(0, MAX_SOURCE_CHARS));
          setDraftStorageConsent(
            draft.draftStorageConsent === true
            && draft.draftStorageConsentVersion === STORY_DRAFT_STORAGE_CONSENT_VERSION
          );
          setDraftStatus(
            draft.updatedAt
              ? `Private draft resumed. Last saved ${draft.updatedAt}.`
              : "Private draft resumed."
          );
        }
      } catch {
        setDraftStatus("Saved draft could not be loaded. Nothing was submitted to a story provider.");
      } finally {
        setDraftLoaded(true);
      }
    });
  }, [cloudReady, draftLoaded]);

  useEffect(() => {
    if (!cloudReady || !verifiedUser || !draftLoaded || !draftStorageConsent) return undefined;
    if (!title.trim() && !theme.trim() && !sourceText.trim()) return undefined;

    const timer = window.setTimeout(async () => {
      try {
        const saveDraft = httpsCallable<Record<string, unknown>, DraftResponse>(
          getFirebaseFunctions(),
          "saveStoryDraft"
        );
        const result = await saveDraft({
          title: title.slice(0, 120),
          theme: theme.slice(0, 80),
          audienceAgeBand,
          mood,
          sourceText: sourceText.slice(0, MAX_SOURCE_CHARS),
          locale: "en-US",
          draftStorageConsent: true,
          draftStorageConsentVersion: STORY_DRAFT_STORAGE_CONSENT_VERSION,
        });
        setDraftStatus(
          result.data.updatedAt
            ? `Private draft saved ${result.data.updatedAt}. It expires after 30 days unless replaced or deleted.`
            : "Private draft saved."
        );
      } catch {
        setDraftStatus("Private draft could not be saved. Story generation was not triggered.");
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [audienceAgeBand, cloudReady, draftLoaded, draftStorageConsent, mood, sourceText, theme, title, verifiedUser]);

  const detailsError = useMemo(() => {
    if (!title.trim()) return "Add a title to continue.";
    if (!theme.trim()) return "Add a theme to continue.";
    if (!AUDIENCE_AGE_BANDS.includes(audienceAgeBand)) return "Choose an audience age band.";
    const unsafeTerm = firstUnsafeTerm([title, theme, mood, sourceText]);
    if (unsafeTerm) return "This story seed includes sensitive content that Storytime cannot process here.";
    if (sourceText.length > MAX_SOURCE_CHARS) return `Keep the source text under ${MAX_SOURCE_CHARS} characters.`;
    return null;
  }, [audienceAgeBand, mood, sourceText, theme, title]);

  const consentError = useMemo(() => {
    if (!adultGuardianAffirmed) {
      return "Storytime is currently adult/guardian-operated. Confirm that you are the adult or guardian operating this story.";
    }
    if (!generationConsent) return "Explicit story-generation consent is required.";
    if (!providerProcessingConsent) {
      return "Consent to the configured story-generation provider is required before cloud generation.";
    }
    return null;
  }, [adultGuardianAffirmed, generationConsent, providerProcessingConsent]);

  const validationError = detailsError || consentError;

  async function handleDraftStorageChange(next: boolean) {
    setDraftStorageConsent(next);
    setDraftStatus(null);

    if (next) {
      setDraftStatus("Private draft autosave enabled. Draft content is not sent to the story-generation provider.");
      return;
    }

    if (!cloudReady || !verifiedUser) return;
    try {
      const deleteDraft = httpsCallable<Record<string, never>, { status?: string }>(
        getFirebaseFunctions(),
        "deleteStoryDraft"
      );
      await deleteDraft({});
      setDraftStatus("Saved private draft deleted.");
    } catch {
      setDraftStatus("Saved draft deletion could not be confirmed. Draft autosave is off; review the privacy request controls if deletion is needed.");
    }
  }

  function goToReview() {
    setSubmitError(null);
    if (detailsError) {
      setSubmitError(detailsError);
      return;
    }
    setStep("review");
  }

  async function handleCreateStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (step !== "review") {
      goToReview();
      return;
    }

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
      const createStory = httpsCallable<Record<string, unknown>, GenerateStoryResponse>(
        getFirebaseFunctions(),
        "generateStorySession"
      );
      const result = await createStory({
        title: title.trim(),
        sourceText: sourceText.trim().slice(0, MAX_SOURCE_CHARS),
        emotionalTone: mood,
        symbolicMotifs: [theme.trim()],
        requestId: createRequestId(),
        locale: "en-US",
        sourceSignals: ["storytime guided form"],
        audienceAgeBand,
        operator: {
          role: "adult_or_guardian",
          affirmed: adultGuardianAffirmed,
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

      if (draftStorageConsent) {
        try {
          const deleteDraft = httpsCallable<Record<string, never>, { status?: string }>(
            getFirebaseFunctions(),
            "deleteStoryDraft"
          );
          await deleteDraft({});
        } catch {
          // Story creation succeeded. Draft cleanup can be retried from settings/privacy controls.
        }
      }

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
          <p className="storytime-subtitle">
            Storytime can shape the memories and reflections you choose into private chapters with a gentler narrative form.
            Nothing is shared unless you choose to share it.
          </p>
        </section>

        <section className="storytime-grid" aria-label="How Storytime works">
          {[
            ["Private first", "Your story remains private unless you explicitly create a shareable version."],
            ["Grounded in your words", "Storytime starts with the memory, theme, and tone you choose rather than inventing a life for you."],
            ["Review before send", "You see the exact audience, tone, theme, and source text before anything is submitted for generation."],
          ].map(([heading, body]) => (
            <article key={heading} className="storytime-card"><h2>{heading}</h2><p>{body}</p></article>
          ))}
        </section>

        <section className="storytime-grid compact" aria-label="Account and story library">
          <AuthPanel />
          <SessionLibrary />
        </section>

        <form className="storytime-card storytime-form" onSubmit={handleCreateStory} aria-describedby={!cloudReady ? "storytime-unavailable" : undefined}>
          <p className="storytime-pill">Private story · {step === "details" ? "Step 1 of 2" : "Step 2 of 2"}</p>
          <h2>{step === "details" ? "Choose the story details" : "Review exactly what will be submitted"}</h2>

          {!cloudReady ? (
            <p className="storytime-warning" id="storytime-unavailable" role="status">
              Story creation is temporarily unavailable. You can still review your saved stories and settings.
            </p>
          ) : null}

          {step === "details" ? (
            <>
              <p>Use only the details you want Storytime to hold. Source text is optional; a few lines are enough.</p>
              <label className="storytime-field">
                Title
                <input className="storytime-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} autoComplete="off" />
              </label>
              <label className="storytime-field">
                Theme
                <input
                  className="storytime-input"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                  maxLength={80}
                  placeholder="A family memory, a quiet turning point, a brave day"
                  autoComplete="off"
                />
              </label>
              <div className="storytime-grid compact">
                <label className="storytime-field">
                  Audience
                  <select
                    className="storytime-input"
                    value={audienceAgeBand}
                    onChange={(event) => setAudienceAgeBand(event.target.value as (typeof AUDIENCE_AGE_BANDS)[number])}
                  >
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
                <textarea
                  className="storytime-input"
                  rows={6}
                  value={sourceText}
                  maxLength={MAX_SOURCE_CHARS}
                  onChange={(event) => setSourceText(event.target.value)}
                  placeholder="Add only the part of the memory you want this story request to use."
                />
              </label>

              <label className="storytime-field">
                <span>
                  <input
                    type="checkbox"
                    checked={draftStorageConsent}
                    onChange={(event) => void handleDraftStorageChange(event.target.checked)}
                    disabled={!cloudReady || !verifiedUser}
                  />{" "}
                  Save and resume this private draft for up to 30 days.
                </span>
                <span className="storytime-helper">
                  Draft storage is separate from generation consent. Saving a draft does not submit it to the story-generation provider.
                </span>
              </label>
              {draftStatus ? <p role="status" className="storytime-helper">{draftStatus}</p> : null}

              {submitError ? <p className="storytime-error" role="alert">{submitError}</p> : null}
              {detailsError ? <p className="storytime-helper">{detailsError}</p> : null}

              <div className="storytime-actions">
                <button className="storytime-button" type="button" onClick={goToReview} disabled={Boolean(detailsError)}>
                  Review story request
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                This is the exact Storytime request you are preparing. Draft storage does not authorize generation,
                provider processing, voice use, public sharing, or memory imports.
              </p>

              <dl className="storytime-review" aria-label="Story request review">
                <div><dt>Title</dt><dd>{title.trim()}</dd></div>
                <div><dt>Theme</dt><dd>{theme.trim()}</dd></div>
                <div><dt>Audience</dt><dd>{audienceLabel(audienceAgeBand)}</dd></div>
                <div><dt>Tone</dt><dd>{mood}</dd></div>
                <div><dt>Locale</dt><dd>English (en-US)</dd></div>
                <div><dt>Source</dt><dd>{sourceText.trim() || "No optional source text provided."}</dd></div>
                <div><dt>Memory import</dt><dd>Off</dd></div>
                <div><dt>Voiceover</dt><dd>Off</dd></div>
                <div><dt>Public sharing</dt><dd>Off</dd></div>
              </dl>

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
                  I consent to Storytime using only the reviewed information above to create this private story.
                </span>
              </label>
              <label className="storytime-field">
                <span>
                  <input
                    type="checkbox"
                    checked={providerProcessingConsent}
                    onChange={(event) => setProviderProcessingConsent(event.target.checked)}
                  />{" "}
                  I consent to the configured story-generation provider processing the reviewed information for this request.
                </span>
              </label>

              {submitError ? <p className="storytime-error" role="alert">{submitError}</p> : null}
              {consentError ? <p className="storytime-helper">{consentError}</p> : null}

              <div className="storytime-actions">
                <button className="storytime-button secondary" type="button" onClick={() => setStep("details")} disabled={isSubmitting}>
                  Back to details
                </button>
                <button className="storytime-button" type="submit" disabled={!cloudReady || Boolean(validationError) || isSubmitting}>
                  {isSubmitting ? "Creating story…" : "Create private story"}
                </button>
              </div>

              <p className="storytime-helper">
                Storytime is adult/guardian-operated. Audience bands shape the requested story; they do not create or authorize a child account.
                Nothing is submitted to the generation provider until you give both generation and provider-processing consent and choose Create private story.
              </p>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
