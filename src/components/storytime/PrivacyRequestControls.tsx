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

type ExportResult = {
  status?: string;
  completeness?: string;
  blockers?: string[];
  packageSha256?: string;
};

type ExportDownloadResult = {
  url?: string;
  expiresAt?: string;
  completeness?: string;
  packageSha256?: string | null;
};

type DeletionPlanResult = {
  planHash?: string;
  counts?: Record<string, number>;
  storageObjectCount?: number;
  executionBlockers?: string[];
  completionBlockers?: string[];
  readyForAdminExecution?: boolean;
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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadExpiresAt, setDownloadExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!cloudReady) return undefined;
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setSignedIn(Boolean(user));
      setEmailVerified(Boolean(user?.emailVerified));
    });
  }, [cloudReady]);

  async function submit(type: PrivacyRequestType) {
    setMessage(null);
    setDownloadUrl(null);
    setDownloadExpiresAt(null);

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
      if (!id) throw new Error("Privacy request id is missing.");

      if (type === "export") {
        const processExport = httpsCallable<Record<string, unknown>, ExportResult>(
          getFirebaseFunctions(),
          "processStorytimeExportRequest"
        );
        const packaged = await processExport({ privacyRequestId: id });
        const blockers = packaged.data.blockers || [];

        if (blockers.length === 0) {
          const getDownload = httpsCallable<Record<string, unknown>, ExportDownloadResult>(
            getFirebaseFunctions(),
            "getStorytimeExportDownloadUrl"
          );
          const download = await getDownload({ privacyRequestId: id });
          setDownloadUrl(download.data.url ?? null);
          setDownloadExpiresAt(download.data.expiresAt ?? null);
          setMessage(
            `Storytime export package is ready. Request ${id}. Integrity SHA-256: ${packaged.data.packageSha256 || "recorded by the server"}.`
          );
        } else {
          setMessage(
            `Storytime export package was created as partial/review-required for request ${id}. Remaining blockers: ${blockers.join(", ")}.`
          );
        }
      } else {
        const planDeletion = httpsCallable<Record<string, unknown>, DeletionPlanResult>(
          getFirebaseFunctions(),
          "planStorytimeDeletion"
        );
        const planned = await planDeletion({ privacyRequestId: id });
        const blockers = planned.data.executionBlockers || [];
        const completionBlockers = planned.data.completionBlockers || [];
        const targets = Object.entries(planned.data.counts ?? {})
          .filter(([, count]) => count > 0)
          .map(([name, count]) => `${name}=${count}`)
          .join(", ");

        setMessage(
          blockers.length === 0
            ? `Deletion dry-run is ready for governed admin execution. Request ${id}; plan hash ${planned.data.planHash || "recorded by the server"}. Targets: ${targets || "none"}. No data has been deleted. Completion blockers: ${completionBlockers.join(", ") || "none currently reported"}.`
            : `Deletion request ${id} is blocked before destructive execution: ${blockers.join(", ")}. Planned targets: ${targets || "none"}. No data has been deleted.`
        );
      }
      setConfirmation(false);
    } catch {
      setMessage("The privacy operation could not be completed safely. No export or deletion has been represented as completed.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Storytime privacy requests">
      <p className="storytime-pill">Privacy requests</p>
      <h2>Export or deletion requests</h2>
      <p>
        These controls create a private, auditable request. Export requests package Storytime-owned data immediately when
        the governed backend can do so. Deletion requests produce a dry-run plan first; destructive execution is admin-only,
        revalidated against the exact plan hash, and never represented as complete without post-delete verification.
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
      {downloadUrl ? (
        <p>
          <a href={downloadUrl} rel="noreferrer">
            Download private Storytime export
          </a>
          {downloadExpiresAt ? ` — link expires ${downloadExpiresAt}` : ""}
        </p>
      ) : null}
    </section>
  );
}
