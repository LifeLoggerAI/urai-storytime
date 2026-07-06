"use client";

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseDb, isStorytimePublicSharingEnabled } from "@/lib/firebase/client";
import type { PublicStoryShare } from "@/lib/storytime/types";

type State =
  | { status: "blocked"; message: string }
  | { status: "loading"; message: string }
  | { status: "notFound"; message: string }
  | { status: "revoked"; message: string }
  | { status: "expired"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; share: PublicStoryShare };

function message(error: unknown) {
  return error instanceof Error ? error.message : "Public share could not be loaded.";
}

function expired(share: PublicStoryShare) {
  return Boolean(share.expiresAt && Date.parse(share.expiresAt) < Date.now());
}

export function ShareStory({ shareId }: { shareId: string }) {
  const shareReady = isStorytimePublicSharingEnabled();
  const [state, setState] = useState<State>(() =>
    shareReady
      ? { status: "loading", message: "Loading public-safe share..." }
      : { status: "blocked", message: "Public sharing is gated until Firebase config and NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING=true are configured." }
  );

  useEffect(() => {
    if (!shareReady) return undefined;
    let active = true;
    async function run() {
      try {
        const db = getFirebaseDb();
        const publicShares = collection(db, "publicStoryShares");
        // Firestore rules only permit anonymous reads of non-revoked shares.
        // Keep the query constrained to the same authorization predicate so
        // Firestore can prove the query cannot return a revoked document.
        const bySlug = await getDocs(
          query(publicShares, where("slug", "==", shareId), where("revoked", "==", false), limit(1))
        );
        const snapshot = bySlug.docs[0];
        if (!active) return;
        if (!snapshot) {
          setState({ status: "notFound", message: "No active public-safe Storytime share was found." });
          return;
        }
        const share = { id: snapshot.id, ...snapshot.data() } as PublicStoryShare;
        if (share.revoked) setState({ status: "revoked", message: "This Storytime share has been revoked." });
        else if (expired(share)) setState({ status: "expired", message: "This Storytime share has expired." });
        else setState({ status: "ready", share });
      } catch (error) {
        if (active) setState({ status: "error", message: message(error) });
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [shareId, shareReady]);

  if (state.status === "ready") {
    return (
      <article className="storytime-hero">
        <p className="storytime-eyebrow">Public-safe Storytime share</p>
        <h1 className="storytime-title">{state.share.title}</h1>
        <p className="storytime-subtitle">{state.share.safeSummary}</p>
        <section className="storytime-card"><p>{state.share.safeBody}</p></section>
        <p className="storytime-helper">This public page shows only redacted share text. Private story records are not exposed here.</p>
      </article>
    );
  }

  return (
    <article className="storytime-card storytime-stack">
      <p className="storytime-pill">Public Share</p>
      <h1>{state.status === "loading" ? "Loading share" : "Share unavailable"}</h1>
      <p className={state.status === "error" ? "storytime-error" : undefined}>{state.message}</p>
      <a className="storytime-button secondary" href="/storytime">Create private story</a>
    </article>
  );
}
