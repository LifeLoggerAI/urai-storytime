"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDb, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import type { EmotionalArcSummary, MemoryScene, NarratorScript, StoryChapter, StoryMoment, StorySession, StoryVersion } from "@/lib/storytime/types";
import { currentStorytimeRecords } from "@/lib/storytime/current-session-records";
import { ChapterTimeline } from "./ChapterTimeline";
import { EmotionalArcViewer } from "./EmotionalArcViewer";
import { MemorySceneCard } from "./MemorySceneCard";
import { SafetyReportControls } from "./SafetyReportControls";
import { ShareControls } from "./ShareControls";
import { StoryPlayer } from "./StoryPlayer";
import { StoryVersionHistory } from "./StoryVersionHistory";
import { StoryRevisionEditor } from "./StoryRevisionEditor";

type Bundle = {
  session: StorySession;
  chapters: StoryChapter[];
  moments: StoryMoment[];
  scenes: MemoryScene[];
  scripts: NarratorScript[];
  versions: StoryVersion[];
  arc: EmotionalArcSummary | null;
};

type State =
  | { status: "blocked"; message: string }
  | { status: "loading"; message: string }
  | { status: "signedOut"; message: string }
  | { status: "notFound"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; bundle: Bundle; user: User; sessionId: string };

function toMessage() {
  return "We couldn’t load that private Storytime session. Check your account and try again.";
}

async function loadBundle(sessionId: string, userId: string, isCurrentAccount: () => boolean): Promise<Bundle | null> {
  const requireCurrentAccount = () => {
    if (!isCurrentAccount()) throw new Error("Storytime account changed during the private read.");
  };
  requireCurrentAccount();
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, "storySessions", sessionId));
  requireCurrentAccount();
  if (!snapshot.exists()) return null;

  const session = { ...snapshot.data(), id: snapshot.id } as StorySession;
  if (session.id !== sessionId || session.userId !== userId) throw new Error("Storytime session is unavailable.");
  const [chapterDocs, momentDocs, sceneDocs, scriptDocs, versionDocs] = await Promise.all([
    getDocs(query(collection(db, "storyChapters"), where("sessionId", "==", sessionId), where("userId", "==", userId), orderBy("order", "asc"))),
    getDocs(query(collection(db, "storyMoments"), where("sessionId", "==", sessionId), where("userId", "==", userId), orderBy("order", "asc"))),
    getDocs(query(collection(db, "memoryScenes"), where("sessionId", "==", sessionId), where("userId", "==", userId))),
    getDocs(query(collection(db, "narratorScripts"), where("sessionId", "==", sessionId), where("userId", "==", userId))),
    getDocs(query(
      collection(db, "storyVersions"),
      where("sessionId", "==", sessionId),
      where("userId", "==", userId)
    ))
  ]);
  requireCurrentAccount();

  let arc: EmotionalArcSummary | null = null;
  if (session.emotionalArcSummaryId) {
    const arcDoc = await getDoc(doc(db, "emotionalArcSummaries", session.emotionalArcSummaryId));
    requireCurrentAccount();
    if (arcDoc.exists() && arcDoc.data().userId === userId && arcDoc.data().sessionId === sessionId) {
      arc = { ...arcDoc.data(), id: arcDoc.id } as EmotionalArcSummary;
    }
  }

  const latest = await getDoc(doc(db, "storySessions", sessionId));
  requireCurrentAccount();
  const latestData = latest.data();
  if (!latest.exists() || latestData?.userId !== userId || latestData.currentVersionId !== session.currentVersionId
    || latestData.updatedAt !== session.updatedAt || JSON.stringify(latestData.consentSnapshot) !== JSON.stringify(session.consentSnapshot)) {
    throw new Error("Storytime session changed during the private read.");
  }

  return {
    session,
    chapters: (session.chapterIds ?? []).flatMap(id => {
      const item = chapterDocs.docs.find(item => item.id === id);
      return item ? [{ ...item.data(), id: item.id } as StoryChapter] : [];
    }),
    moments: momentDocs.docs.map((item) => ({ ...item.data(), id: item.id }) as StoryMoment),
    scenes: sceneDocs.docs.map((item) => ({ ...item.data(), id: item.id }) as MemoryScene),
    scripts: scriptDocs.docs.map((item) => ({ ...item.data(), id: item.id }) as NarratorScript),
    versions: versionDocs.docs.map((item) => ({ ...item.data(), id: item.id }) as StoryVersion),
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
    let authEpoch = 0;
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const epoch = ++authEpoch;
      const isCurrentAccount = () => active && epoch === authEpoch && auth.currentUser === user;
      if (!user) {
        setState({ status: "signedOut", message: "Sign in is required to view saved cloud sessions." });
        return;
      }
      setState({ status: "loading", message: "Loading cloud session..." });
      try {
        const bundle = await loadBundle(sessionId, user.uid, isCurrentAccount);
        if (!isCurrentAccount()) return;
        if (!bundle) {
          setState({ status: "notFound", message: "No saved cloud session was found for this id." });
          return;
        }
        setState({ status: "ready", bundle, user, sessionId });
      } catch {
        if (isCurrentAccount()) setState({ status: "error", message: toMessage() });
      }
    });
    return () => {
      active = false;
      authEpoch += 1;
      unsubscribe();
    };
  }, [cloudReady, sessionId]);

  // Hide a settled prior route/account immediately, including the render
  // before React has run the new subscription effect.
  if (state.status === "ready" && (!cloudReady || state.sessionId !== sessionId || state.user !== getFirebaseAuth().currentUser)) {
    return <section className="storytime-card storytime-stack" role="status" aria-live="polite" aria-busy={true}>Loading current private story...</section>;
  }

  if (state.status === "ready") {
    const { bundle } = state;
    const selected = currentStorytimeRecords(bundle);
    return (
      <section className="storytime-stack" aria-label="Cloud Storytime session">
        <StoryPlayer session={bundle.session} chapters={bundle.chapters} narratorScripts={bundle.scripts} />
        <StoryVersionHistory versions={bundle.versions} />
        <StoryRevisionEditor
          key={`${bundle.session.id}:${bundle.session.currentVersionId ?? "legacy"}`}
          session={bundle.session}
          chapter={selected.chapter}
          moment={selected.moment}
          narrator={selected.narrator}
          versions={bundle.versions}
        />
        <section className="storytime-grid">
          <ChapterTimeline chapters={bundle.chapters} />
          {selected.scene ? <MemorySceneCard scene={selected.scene} /> : <article className="storytime-card"><h2>No selected scene</h2><p>The scene linked to the current story is unavailable.</p></article>}
          {bundle.arc ? <EmotionalArcViewer arc={bundle.arc} /> : <article className="storytime-card"><h2>No saved arc</h2><p>This cloud session has no saved emotional arc yet.</p></article>}
        </section>
        <ShareControls session={bundle.session} />
        <SafetyReportControls session={bundle.session} />
      </section>
    );
  }

  return (
    <section className="storytime-card storytime-stack">
      <p className="storytime-pill">Cloud Session</p>
      <h1>{state.status === "loading" ? "Loading story session" : "Story session unavailable"}</h1>
      <p
        className={state.status === "error" ? "storytime-error" : undefined}
        role={state.status === "error" ? "alert" : "status"}
        aria-live={state.status === "error" ? "assertive" : "polite"}
        aria-busy={state.status === "loading" ? true : undefined}
      >
        {state.message}
      </p>
      <a className="storytime-button secondary" href="/storytime">Back to Storytime</a>
    </section>
  );
}
