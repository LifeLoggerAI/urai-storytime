"use client";

import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDb, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import type { StorySession } from "@/lib/storytime/types";

type LibraryState =
  | { status: "blocked"; message: string }
  | { status: "loading"; message: string }
  | { status: "signedOut"; message: string }
  | { status: "empty"; message: string }
  | { status: "ready"; sessions: StorySession[] }
  | { status: "error"; message: string };

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Session library could not be loaded.";
}

export function SessionLibrary() {
  const cloudReady = isStorytimeCloudModeEnabled();
  const [state, setState] = useState<LibraryState>(() =>
    cloudReady
      ? { status: "loading", message: "Checking your saved sessions..." }
      : {
          status: "blocked",
          message: "Cloud session history is unavailable until Firebase client env vars and NEXT_PUBLIC_STORYTIME_CLOUD_MODE=true are configured."
        }
  );

  useEffect(() => {
    if (!cloudReady) return undefined;

    let active = true;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!active) return;
      if (!user) {
        setState({ status: "signedOut", message: "Sign in is required before saved cloud sessions can be listed." });
        return;
      }

      setState({ status: "loading", message: "Loading saved cloud sessions..." });
      try {
        const db = getFirebaseDb();
        const sessionsQuery = query(
          collection(db, "storySessions"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(8)
        );
        const snapshot = await getDocs(sessionsQuery);
        const sessions = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }) as StorySession);

        if (!active) return;
        setState(sessions.length > 0 ? { status: "ready", sessions } : { status: "empty", message: "No saved cloud sessions yet." });
      } catch (error) {
        if (!active) return;
        setState({ status: "error", message: toErrorMessage(error) });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [cloudReady]);

  if (state.status === "ready") {
    return (
      <section className="storytime-card storytime-stack" aria-label="Saved sessions">
        <p className="storytime-pill">Cloud Library</p>
        <h2>Saved sessions</h2>
        <ul className="storytime-list">
          {state.sessions.map((session) => (
            <li key={session.id}>
              <a href={`/storytime/${encodeURIComponent(session.id)}`}>{session.title}</a>
              <span>{session.status} / {session.visibility}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Saved sessions">
      <p className="storytime-pill">Cloud Library</p>
      <h2>Saved sessions</h2>
      <p className={state.status === "error" ? "storytime-error" : undefined}>{state.message}</p>
      <p className="storytime-helper">Demo sessions are not written to a user account. Cloud history only appears after Firebase auth, rules, indexes, and cloud mode are configured.</p>
    </section>
  );
}
