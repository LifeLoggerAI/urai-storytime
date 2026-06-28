"use client";

import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDb, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import type { EmotionalArcSummary, MemoryScene, NarratorScript, StoryChapter, StorySession } from "@/lib/storytime/types";
import { ChapterTimeline } from "./ChapterTimeline";
import { EmotionalArcViewer } from "./EmotionalArcViewer";
import { MemorySceneCard } from "./MemorySceneCard";
import { ShareControls } from "./ShareControls";
import { StoryPlayer } from "./StoryPlayer";

type Bundle = {
  session: StorySession;
  chapters: StoryChapter[];
  scenes: MemoryScene[];
  scripts: NarratorScript[];
  arc: EmotionalArcSummary | null;
};

type State =
  | { status: "blocked"; message: string }
  | { status: "loading"; message: string }
  | { status: "signedOut"; message: string }
  | { status: "notFound"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; bundle: Bundle };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Cloud session load failed.";
}

async function loadBundle(sessionId: string): Promise<Bundle | null> {
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, "storySessions", sessionId));
  if (!snapshot.exists()) return null;

  const session = { id: snapshot.id, ...snapshot.data() } as StorySession;
  const [chapterDocs, sceneDocs, scriptDocs] = await Promise.all([
    getDocs(query(collection(db, "storyChapters"), where("sessionId", "==", sessionId), orderBy("order", "asc"))),
    getDocs(query(collection(db, "memoryScenes"), where("sessionId", "==", sessionId))),
    getDocs(query(collection(db, "narratorScripts"), where("sessionId", "==", sessionId)))
  ]);

  let arc: EmotionalArcSummary | null = null;
  if (session.emotionalArcSummaryId) {
    const arcDoc = await getDoc(doc(db, "emotionalArcSummaries", session.emotionalArcSummaryId));
    if (arcDoc.exists()) arc = { id: arcDoc.id, ...arcDoc.data() } as EmotionalArcSummary;
  }

  return {
    session,
    chapters: chapterDocs.docs.map((item) => ({ id: item.id, ...item.data() }) as StoryChapter),
    scenes: sceneDocs.docs.map((item) => ({ id: item.id, ...item.data() }) as MemoryScene),
    scripts: scriptDocs.docs.map((item) => ({ id: item.id, ...item.data() }) as NarratorScript),
    arc
  };
}

export function CloudSession({ sessionId }: { sessionId: string }) {
  const cloudReady = isStorytimeCloudModeEnabled();
  const [state, setState] = useState<State>(() =>
    cloudReady
      ? { status: "loading", message: "Loading cloud session..." }
      : { status: "blocked", message: "Cloud session loading is gated until Firebase env vars, provider readiness, and cloud mode are configured." }
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
        const bundle = await loadBundle(sessionId);
        if (!active) return;
        if (!bundle) {
          setState({ status: "notFound", message: "No saved cloud session was found for this id." });
          return;
        }
        setState({ status: "ready", bundle });
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
    const { bundle } = state;
    return (
      <section className="storytime-stack" aria-label="Cloud Storytime session">
        <StoryPlayer session={bundle.session} chapters={bundle.chapters} narratorScripts={bundle.scripts} />
        <section className="storytime-grid">
          <ChapterTimeline chapters={bundle.chapters} />
          {bundle.scenes[0] ? <MemorySceneCard scene={bundle.scenes[0]} /> : <article className="storytime-card"><h2>No saved scene</h2><p>This cloud session has no saved memory scene yet.</p></article>}
          {bundle.arc ? <EmotionalArcViewer arc={bundle.arc} /> : <article className="storytime-card"><h2>No saved arc</h2><p>This cloud session has no saved emotional arc yet.</p></article>}
        </section>
        <ShareControls session={bundle.session} />
      </section>
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
