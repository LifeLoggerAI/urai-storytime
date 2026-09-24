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
  privacyRequestId?: string;
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
  executionBlockers?: string[];
  completionBlockers?: string[];
  readyForAdminExecution?: boolean;
};

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `privacy-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function blockerSummary(blockers: string[] | undefined) {
  if (!blockers?.length) return "";
  return ` Blockers: ${blockers.join(", ")}.`;
}

export function PrivacyRequestControls() {
  const cloudReady = isStorytimeCloudModeEnabled();
  const [signedIn, setSignedIn] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [working, setWorking] = useState<PrivacyRequestType | "download" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [exportRequestId, setExportRequestId] = useState<string | null>(null);
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
      const functions = getFirebaseFunctions();
      const createRequest = httpsCallable<Record<string, unknown>, PrivacyRequestResult>(
        functions,
        "requestPrivacyOperation"
      );
      const created = await createRequest({
        requestId: createRequestId(),
        type,
        scope: "account",
        confirmation: true
      });
      const privacyRequestId = created.data.privacyRequestId;
      if (!privacyRequestId) throw new Error("Privacy request id was not returned.");

      if (type === "export") {
        const processExport = httpsCallable<Record<string, unknown>, ExportResult>(
          functions,
          "processStorytimeExportRequest"
        );
        const processed = await processExport({ privacyRequestId });
        const blockers = processed.data.blockers || [];

        const getDownload = httpsCallable<Record<string, unknown>, ExportDownloadResult>(
          functions,
          "getStorytimeExportDownloadUrl"
        );
        const download = await getDownload({ privacyRequestId });
        if (download.data.url) setDownloadUrl(download.data.url);
        if (download.data.expiresAt) setDownloadExpiresAt(download.data.expiresAt);

        setMessage(
          processed.data.completeness === "complete_for_storytime_owned_data"
            ? "Storytime export package is ready. It contains the Storytime-owned data currently covered by this repository."
            : `Storytime prepared a partial export that requires privacy review before it can be represented as a complete account export.${blockerSummary(blockers)}`
        );
      } else {
        const planDeletion = httpsCallable<Record<string, unknown>, DeletionPlanResult>(
          functions,
          "planStorytimeDeletion"
        );
        const planned = await planDeletion({ privacyRequestId });
        const executionBlockers = planned.data.executionBlockers || [];
        const completionBlockers = planned.data.completionBlockers || [];

        setMessage(
          planned.data.readyForAdminExecution
            ? `Deletion plan created. Destructive deletion is not user-triggered; an authorized privacy administrator must execute the exact plan hash ${planned.data.planHash || "recorded by the server"} and completion still requires post-delete verification.${blockerSummary(completionBlockers)}`
            : `Deletion request recorded but destructive execution is blocked until the listed privacy/runtime prerequisites are resolved.${blockerSummary(executionBlockers)}${blockerSummary(completionBlockers)}`
        );
      }

      setConfirmation(false);
    } catch {
      setMessage("The privacy operation could not be completed safely. No export or deletion has been represented as complete.");
    } finally {
      setWorking(null);
    }
  }

  async function downloadExport() {
    if (!exportRequestId) return;
    setWorking("download");
    setMessage(null);
    try {
      const getDownload = httpsCallable<Record<string, unknown>, { url?: string; expiresAt?: string; completeness?: string }>(
        getFirebaseFunctions(),
        "getStorytimeExportDownloadUrl"
      );
      const result = await getDownload({ privacyRequestId: exportRequestId });
      if (!result.data.url) throw new Error("Export URL is unavailable.");
      window.location.assign(result.data.url);
      setMessage(`A short-lived private export link was created for request ${exportRequestId}. It expires at ${result.data.expiresAt || "the server-recorded expiry"}.`);
    } catch {
      setMessage("The private export download could not be prepared. The export request remains unchanged.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Storytime privacy requests">
      <p className="storytime-pill">Privacy requests</p>
      <h2>Export or deletion requests</h2>
      <p>
        Storytime can package the data owned by this repository and can prepare a deletion plan. Account deletion remains
        fail-closed behind admin execution, legal-hold checks, environment isolation, provider/media cleanup, and completion verification.
      </p>
      {!cloudReady ? <p className="storytime-helper">Privacy operations are unavailable until the verified cloud runtime is enabled.</p> : null}
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
          I understand this submits an account-level privacy request and that cross-system data may require separate governed processing.
        </span>
      </label>
      <div className="storytime-actions">
        <button
          className="storytime-button secondary"
          type="button"
          onClick={() => submit("export")}
          disabled={!confirmation || working !== null || !cloudReady || !signedIn || !emailVerified}
        >
          {working === "export" ? "Preparing export…" : "Prepare Storytime export"}
        </button>
        <button
          className="storytime-button secondary"
          type="button"
          onClick={() => submit("deletion")}
          disabled={!confirmation || working !== null || !cloudReady || !signedIn || !emailVerified}
        >
          {working === "deletion" ? "Preparing deletion plan…" : "Request account deletion plan"}
        </button>
      </div>
      {message ? <p role="status">{message}</p> : null}
      {downloadUrl ? (
        <p>
          <a href={downloadUrl} rel="noreferrer">
            Download private Storytime export
          </a>
          {downloadExpiresAt ? ` — link expires ${new Date(downloadExpiresAt).toLocaleString()}` : ""}
        </p>
      ) : null}
    </section>
  );
}
