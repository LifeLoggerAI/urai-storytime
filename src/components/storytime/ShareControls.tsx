"use client";

import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { getFirebaseFunctions, isStorytimePublicSharingEnabled } from "@/lib/firebase/client";
import type { StorySession } from "@/lib/storytime/types";

type CreateShareResult = { shareId?: string; slug?: string };
type RevokeShareResult = { status?: string; shareId?: string };

function toMessage() {
  return "We couldn’t complete that sharing request. No private story data was exposed.";
}

export function ShareControls({ session }: { session: StorySession }) {
  const sharingReady = isStorytimePublicSharingEnabled();
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const currentShareId = session.publicShareId || null;

  async function createShare() {
    setMessage(null);
    setMessageIsError(false);
    if (!consent) {
      setMessageIsError(true);
      setMessage("Explicit public-sharing consent is required before creating a share.");
      return;
    }
    setWorking(true);
    try {
      const callable = httpsCallable<Record<string, unknown>, CreateShareResult>(getFirebaseFunctions(), "createPublicStoryShare");
      const result = await callable({ sessionId: session.id, consent: true });
      setShareSlug(result.data.slug || null);
      setMessage("Public-safe share created. Re-open the session after refresh to see persisted share status.");
    } catch (error) {
      setMessageIsError(true);
      setMessage(toMessage());
    } finally {
      setWorking(false);
    }
  }

  async function revokeShare() {
    setMessage(null);
    setMessageIsError(false);
    if (!currentShareId) {
      setMessageIsError(true);
      setMessage("No active public share id is attached to this session.");
      return;
    }
    setWorking(true);
    try {
      const callable = httpsCallable<Record<string, unknown>, RevokeShareResult>(getFirebaseFunctions(), "revokePublicStoryShare");
      await callable({ shareId: currentShareId });
      setShareSlug(null);
      setMessage("Public share revoked. Refresh the session to confirm private visibility.");
    } catch (error) {
      setMessageIsError(true);
      setMessage(toMessage());
    } finally {
      setWorking(false);
    }
  }

  if (!sharingReady) {
    return (
      <section className="storytime-card storytime-stack" aria-label="Public sharing controls">
        <p className="storytime-pill">Public Sharing</p>
        <h2>Public sharing gated</h2>
        <p>Public share creation is disabled until Firebase client config and NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING=true are configured and verified.</p>
      </section>
    );
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Public sharing controls">
      <p className="storytime-pill">Public Sharing</p>
      <h2>Public-safe share controls</h2>
      <p>Only redacted public-safe text is shared. Private story records are not exposed on public pages.</p>
      {currentShareId ? (
        <button className="storytime-button secondary" type="button" onClick={revokeShare} disabled={working}>Revoke public share</button>
      ) : (
        <>
          <label className="storytime-field">
            <span><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I consent to create a public-safe redacted share.</span>
          </label>
          <button className="storytime-button" type="button" onClick={createShare} disabled={working || !consent}>Create public-safe share</button>
        </>
      )}
      {shareSlug ? <p><a href={`/share/story/${encodeURIComponent(shareSlug)}`}>Open public-safe share</a></p> : null}
      {message ? (
        <p className={messageIsError ? "storytime-error" : "storytime-helper"} role={messageIsError ? "alert" : "status"} aria-live={messageIsError ? "assertive" : "polite"}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
