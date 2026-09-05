"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseDb, isStorytimePublicSharingEnabled } from "@/lib/firebase/client";

type PublicSafeStoryShare = {
  id: string;
  schemaVersion: "public-story-share-v2";
  slug: string;
  title: string;
  safeSummary: string;
  safeBody: string;
  expiresAt: string;
  revoked: false;
};

type State =
  | { status: "blocked"; message: string }
  | { status: "loading"; message: string }
  | { status: "notFound"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; share: PublicSafeStoryShare };

function message(error: unknown) {
  return error instanceof Error ? error.message : "Public share could not be loaded.";
}

function firestoreCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

function timestampIso(value: unknown) {
  if (
    typeof value === "object"
    && value !== null
    && "toDate" in value
    && typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function parsePublicShare(id: string, data: Record<string, unknown>): PublicSafeStoryShare | null {
  if (data.schemaVersion !== "public-story-share-v2") return null;
  if (data.slug !== id || data.revoked !== false) return null;
  if ("userId" in data || "sessionId" in data) return null;
  if (typeof data.title !== "string" || typeof data.safeSummary !== "string" || typeof data.safeBody !== "string") return null;
  const expiresAt = timestampIso(data.expiresAt);
  if (!expiresAt || Date.parse(expiresAt) <= Date.now()) return null;
  return {
    id,
    schemaVersion: "public-story-share-v2",
    slug: id,
    title: data.title,
    safeSummary: data.safeSummary,
    safeBody: data.safeBody,
    expiresAt,
    revoked: false
  };
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
        const snapshot = await getDoc(doc(db, "publicStoryShares", shareId));
        if (!active) return;
        if (!snapshot.exists()) {
          setState({ status: "notFound", message: "No active public-safe Storytime share was found." });
          return;
        }
        const share = parsePublicShare(snapshot.id, snapshot.data());
        if (!share) {
          setState({ status: "notFound", message: "No active public-safe Storytime share was found." });
          return;
        }
        setState({ status: "ready", share });
      } catch (error) {
        if (!active) return;
        const code = firestoreCode(error);
        if (code.endsWith("permission-denied") || code.endsWith("not-found")) {
          setState({ status: "notFound", message: "No active public-safe Storytime share was found." });
        } else {
          setState({ status: "error", message: message(error) });
        }
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
