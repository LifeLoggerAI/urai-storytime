"use client";

import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDb, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import type { StoryDraft } from "@/lib/storytime/types";

type State =
  | { status: "blocked"; drafts: StoryDraft[] }
  | { status: "signedOut"; drafts: StoryDraft[] }
  | { status: "loading"; drafts: StoryDraft[] }
  | { status: "ready"; drafts: StoryDraft[] }
  | { status: "error"; drafts: StoryDraft[] };

export function DraftLibrary() {
  const cloudReady = isStorytimeCloudModeEnabled();
  const [state, setState] = useState<State>(() =>
    cloudReady ? { status: "loading", drafts: [] } : { status: "blocked", drafts: [] }
  );

  useEffect(() => {
    if (!cloudReady) return undefined;
    let active = true;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!active) return;
      if (!user) {
        setState({ status: "signedOut", drafts: [] });
        return;
      }
      try {
        const snapshot = await getDocs(query(
          collection(getFirebaseDb(), "storyDrafts"),
          where("userId", "==", user.uid),
          orderBy("updatedAt", "desc"),
          limit(5)
        ));
        if (!active) return;
        setState({
          status: "ready",
          drafts: snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as StoryDraft)
        });
      } catch {
        if (active) setState({ status: "error", drafts: [] });
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [cloudReady]);

  return (
    <section className="storytime-card storytime-stack" aria-label="Private Storytime drafts">
      <p className="storytime-pill">Private drafts</p>
      <h2>Continue where you left off</h2>
      {!cloudReady ? <p>Draft loading stays off until the verified cloud runtime is enabled.</p> : null}
      {state.status === "signedOut" ? <p>Sign in to see your private drafts.</p> : null}
      {state.status === "loading" ? <p>Loading private drafts…</p> : null}
      {state.status === "error" ? <p>Private drafts are temporarily unavailable.</p> : null}
      {state.status === "ready" && state.drafts.length === 0 ? <p>No saved private drafts.</p> : null}
      {state.status === "ready" ? state.drafts.map((draft) => (
        <article className="storytime-card" key={draft.id}>
          <h3>{draft.title || "Untitled private draft"}</h3>
          <p>{draft.theme || "No theme yet"}</p>
          <p className="storytime-helper">Revision {draft.revision} · last saved {new Date(draft.updatedAt).toLocaleString()}</p>
          <a className="storytime-button secondary" href={`/storytime?draft=${encodeURIComponent(draft.id)}`}>Resume draft</a>
        </article>
      )) : null}
      <p className="storytime-helper">
        Draft storage is separate from generation consent. Resuming a draft does not authorize AI/provider processing.
      </p>
    </section>
  );
}
