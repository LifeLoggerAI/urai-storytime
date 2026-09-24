"use client";

import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseFunctions, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";

type PrivacyRequestType = "export" | "deletion";
type PrivacyRequestResult = {
  privacyRequestId?: string;
  status?: string;
  reused?: boolean;
};

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `privacy-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function PrivacyRequestControls() {
  const cloudReady = isStorytimeCloudModeEnabled();
  const [signedIn, setSignedIn] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [working, setWorking] = useState<PrivacyRequestType | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!cloudReady) return undefined;
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setSignedIn(Boolean(user));
      setEmailVerified(Boolean(user?.emailVerified));
    });
  }, [cloudReady]);

  async function submit(type: PrivacyRequestType) {
    setMessage(null);
    if (!confirmation) {
      setMessage("Confirm the request before submitting it.");
      return;
    }
    if (!signedIn || !emailVerified) {
      setMessage("Sign in with a verified account before creating a privacy request.");
      return;
    }

    setWorking(type);
    try {
      const callable = httpsCallable<Record<string, unknown>, PrivacyRequestResult>(
        getFirebaseFunctions(),
        "requestPrivacyOperation"
      );
      const result = await callable({
        requestId: createRequestId(),
        type,
        scope: "account",
        confirmation: true
      });
      const id = result.data.privacyRequestId;
      setMessage(
        type === "export"
          ? `Export request received${id ? ` (${id})` : ""}. This records the request; an export is not represented as complete until a completion receipt exists.`
          : `Deletion request received${id ? ` (${id})` : ""}. No data is represented as deleted until the governed deletion workflow records completion.`
      );
      setConfirmation(false);
    } catch {
      setMessage("The privacy request could not be created. No export or deletion has been represented as completed.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Storytime privacy requests">
      <p className="storytime-pill">Privacy requests</p>
      <h2>Export or deletion requests</h2>
      <p>
        These controls create a private, auditable request. They do not claim that an export or deletion has finished;
        completion requires the governed backend workflow and a completion receipt.
      </p>
      {!cloudReady ? <p className="storytime-helper">Privacy requests are unavailable until the verified cloud runtime is enabled.</p> : null}
      {cloudReady && !signedIn ? <p className="storytime-helper">Sign in to create a privacy request.</p> : null}
      {cloudReady && signedIn && !emailVerified ? <p className="storytime-helper">Verify the account email before creating a privacy request.</p> : null}
      <label className="storytime-field">
        <span>
          <input
            type="checkbox"
            checked={confirmation}
            onChange={(event) => setConfirmation(event.target.checked)}
            disabled={!cloudReady || !signedIn || !emailVerified || working !== null}
          />{" "}
          I understand this submits an account-level privacy request for review and processing.
        </span>
      </label>
      <div className="storytime-actions">
        <button
          className="storytime-button secondary"
          type="button"
          onClick={() => submit("export")}
          disabled={!confirmation || working !== null || !cloudReady || !signedIn || !emailVerified}
        >
          {working === "export" ? "Submitting…" : "Request account export"}
        </button>
        <button
          className="storytime-button secondary"
          type="button"
          onClick={() => submit("deletion")}
          disabled={!confirmation || working !== null || !cloudReady || !signedIn || !emailVerified}
        >
          {working === "deletion" ? "Submitting…" : "Request account deletion"}
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
