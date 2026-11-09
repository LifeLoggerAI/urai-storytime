"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { useEffect, useState } from "react";
import { captureStorytimeAccountLease } from "@/lib/storytime/current-account-lease";
import { getFirebaseAuth, getFirebaseFunctions, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";

type RecoveryItem = {
  requestId: string;
  state: "ready" | "processing" | "cancellation_requested" | "cancelled" | "requires_review";
  sessionId: string | null;
  updatedAt: string | null;
  retryAuthorized: false;
};

type RecoveryResponse = { items: RecoveryItem[]; retryAuthorized: false; requiresOwnerReview: true };

type RecoveryView =
  | { state: "waiting" | "signed_out" | "empty" | "error"; message: string }
  | { state: "ready"; actor: User; items: RecoveryItem[] };

export function StoryGenerationRecovery() {
  const cloudReady = isStorytimeCloudModeEnabled();
  const [view, setView] = useState<RecoveryView>({
    state: "waiting",
    message: "Checking your generation history…",
  });

  useEffect(() => {
    if (!cloudReady) return undefined;
    const auth = getFirebaseAuth();
    let active = true;
    let epoch = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const currentEpoch = ++epoch;
      const lease = captureStorytimeAccountLease(user, currentEpoch, () => auth.currentUser, () => epoch);
      if (!active) return;
      if (!user) {
        setView({ state: "signed_out", message: "Sign in to check generation status." });
        return;
      }
      setView({ state: "waiting", message: "Checking generation status…" });
      try {
        const recover = httpsCallable<Record<string, never>, RecoveryResponse>(
          getFirebaseFunctions(),
          "getStorytimeGenerationRecovery",
        );
        const result = await recover({});
        if (!active || !lease.isCurrent()) return;
        const items = Array.isArray(result.data.items) ? result.data.items : [];
        setView(items.length ? { state: "ready", actor: user, items } : {
          state: "empty", message: "No recent generation requests were found.",
        });
      } catch {
        if (active && lease.isCurrent()) setView({
          state: "error", message: "Generation status could not be verified. Do not resubmit an uncertain request.",
        });
      }
    });

    return () => {
      active = false;
      epoch += 1;
      unsubscribe();
    };
  }, [cloudReady]);

  if (!cloudReady) return null;

  // Match exact Firebase User object on every render, not only when an
  // asynchronous request resolves. A replaced actor must not see old links.
  if (view.state === "ready" && view.actor !== getFirebaseAuth().currentUser) {
    return <section className="storytime-card" role="status" aria-busy={true}>
      Checking private generation account…
    </section>;
  }

  return <section className="storytime-card storytime-stack" aria-label="Generation status">
    <h2>Recent generation requests</h2>
    {view.state !== "ready"
      ? <p role="status" aria-live="polite">{view.message}</p>
      : <ul className="storytime-list">
          {view.items.map((item) => <li key={item.requestId}>
            <span>{item.state === "ready" ? "Ready" :
              item.state === "processing" ? "Processing" :
              item.state === "cancelled" ? "Cancelled" :
              item.state === "cancellation_requested" ? "Cancellation requested" :
              "Needs review"}</span>
            {item.state === "ready" && item.sessionId
              ? <a href={`/storytime/${encodeURIComponent(item.sessionId)}`}>Open private story</a>
              : null}
          </li>)}
        </ul>}
    <p className="storytime-helper">A pending or uncertain request is not permission to generate again.
      This view never settles provider charges or verifies recorded-memory sources.</p>
  </section>;
}
