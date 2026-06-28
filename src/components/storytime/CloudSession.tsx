"use client";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDb, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import type { StorySession } from "@/lib/storytime/types";

type State =
  | { status: "blocked"; message: string }
  | { status: "loading"; message: string }
  | { status: "signedOut"; message: string }
  | { status: "notFound"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; session: StorySession };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Cloud session load failed.";
}

export function CloudSession({ sessionId }: { sessionId: string }) {
  const cloudReady = isStorytimeCloudModeEnabled();
  const [state, setState] = useState<State>(() =>
    cloudReady
      ? { status: "loading", message: "Loading cloud session..." }
      : { status: "blocked", message: "Cloud session loading is gated until Firebase env vars and cloud mode are configured." }
  );

  useEffect(() => {
    if (!cloudReady) return undefined;
    let active = true;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!active) return;
      if (!user) {
        setState({ status: "signedOut", message: "Sign in is required to view saved cloud sessions." });
        return;
      }
      try {
        const snapshot = await getDoc(doc(getFirebaseDb(), "storySessions", sessionId));
        if (!active) return;
        if (!snapshot.exists()) {
          setState({ status: "notFound", message: "No saved cloud session was found for this id." });
          return;
        }
        setState({ status: "ready", session: { id: snapshot.id, ...snapshot.data() } as StorySession });
      } catch (error) {
        if (active) setState({ status: "error", message: toMessage(error) });
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [cloudReady, sessionId]);

  if (state.status === "ready") {
    return (
      <article className="storytime-card storytime-stack">
        <p className="storytime-pill">Cloud Session</p>
        <h1>{state.session.title}</h1>
        <p>{state.session.whyGenerated}</p>
        <p>Status: {state.session.status}. Visibility: {state.session.visibility}. Safety: {state.session.safetyStatus}.</p>
        <p className="storytime-helper">Full chapter/media hydration is intentionally gated until Firestore indexes, rules, and callable deployment are verified in staging.</p>
      </article>
    );
  }

  return (
    <section className="storytime-card storytime-stack">
      <p className="storytime-pill">Cloud Session</p>
      <h1>{state.status === "loading" ? "Loading story session" : "Story session unavailable"}</h1>
      <p className={state.status === "error" ? "storytime-error" : undefined}>{state.message}</p>
      <a className="storytime-button secondary" href="/storytime">Back to Storytime</a>
    </section>
  );
}
