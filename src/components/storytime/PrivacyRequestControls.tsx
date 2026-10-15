"use client";

import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { useEffect, useRef, useState } from "react";
import { getFirebaseAuth, getFirebaseClientApp, getFirebaseFunctions, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import { fetchAuthorizedStorytimeExport, type StorytimeExportDownload } from "@/lib/storytime/export-download";
import { captureStorytimePrivacyActorLease, awaitCurrentStorytimePrivacyActor } from "@/lib/storytime/privacy-actor-lease";

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
  const [working, setWorking] = useState<PrivacyRequestType | "download" | "withdraw" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [downloadAuthorization, setDownloadAuthorization] = useState<StorytimeExportDownload | null>(null);
  const authEpoch = useRef(0);
  // Bind confirmation and each issued download capability to the exact User object,
  // not merely the UID (which may be reused following account recreation).
  const confirmationActor = useRef<ReturnType<typeof getFirebaseAuth>["currentUser"]>(null);
  const downloadActor = useRef<ReturnType<typeof getFirebaseAuth>["currentUser"]>(null);
  const captureLease = () => {
    const actor = getFirebaseAuth().currentUser;
    return { actor, lease: captureStorytimePrivacyActorLease(actor, authEpoch.current,
      () => getFirebaseAuth().currentUser, () => authEpoch.current) };
  };

  useEffect(() => {
    if (!cloudReady) return undefined;
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      authEpoch.current++;
      // A prior actor's pending callback cannot install private request metadata
      // or leave stale controls visible under a newly signed-in account.
      confirmationActor.current = null;
      downloadActor.current = null;
      setConfirmation(false);
      setWorking(null);
      setMessage(null);
      setSignedIn(Boolean(user));
      setEmailVerified(Boolean(user?.emailVerified));
      setDownloadAuthorization(null);
    });
  }, [cloudReady]);

  async function submit(type: PrivacyRequestType) {
    setMessage(null);
    setDownloadAuthorization(null);
    downloadActor.current = null;
    const { actor, lease } = captureLease();

    if (!confirmation || confirmationActor.current !== actor) {
      setMessage("Confirm the request before submitting it.");
      return;
    }
    if (!signedIn || !emailVerified || !lease.isCurrent()) {
      setMessage("Sign in with a verified account before creating a privacy request.");
      return;
    }

    setWorking(type);
    try {
      const callable = httpsCallable<Record<string, unknown>, PrivacyRequestResult>(
        getFirebaseFunctions(),
        "requestPrivacyOperation"
      );
      const result = await awaitCurrentStorytimePrivacyActor(lease, () => callable({
        requestId: createRequestId(),
        type,
        scope: "account",
        confirmation: true
      }));
      const id = result.data.privacyRequestId;
      if (!id) throw new Error("Privacy request id is missing.");

      if (type === "export") {
        const processExport = httpsCallable<Record<string, unknown>, ExportResult>(
          getFirebaseFunctions(),
          "processStorytimeExportRequest"
        );
        const packaged = await awaitCurrentStorytimePrivacyActor(lease, () => processExport({ privacyRequestId: id }));
        const blockers = packaged.data.blockers || [];

        if (blockers.length === 0) {
          const getDownload = httpsCallable<Record<string, unknown>, StorytimeExportDownload>(
            getFirebaseFunctions(),
            "getStorytimeExportDownloadUrl"
          );
          const download = await awaitCurrentStorytimePrivacyActor(lease, () => getDownload({ privacyRequestId: id }));
          downloadActor.current = actor;
          setDownloadAuthorization(download.data);
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
        const planned = await awaitCurrentStorytimePrivacyActor(lease, () => planDeletion({ privacyRequestId: id }));
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
      if (!lease.isCurrent()) return;
      confirmationActor.current = null;
      setConfirmation(false);
    } catch {
      if (lease.isCurrent()) setMessage("The privacy operation could not be completed safely. No export or deletion has been represented as completed.");
    } finally {
      if (lease.isCurrent()) setWorking(null);
    }
  }

  async function downloadExport() {
    const { actor: user, lease } = captureLease();
    if (!user || !downloadAuthorization || !lease.isCurrent() || downloadActor.current !== user) return;
    setWorking("download");
    try {
      const blob = await fetchAuthorizedStorytimeExport({
        authorization: downloadAuthorization,
        projectId: getFirebaseClientApp().options.projectId ?? "",
        getIdToken: () => user.getIdToken(true),
        isCurrentAccount: () => lease.isCurrent()
      });
      if (!lease.isCurrent() || downloadActor.current !== user) throw new Error("The active account changed.");
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "storytime-export.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setMessage("The verified Storytime export download has started.");
    } catch {
      if (lease.isCurrent()) {
        downloadActor.current = null;
        setDownloadAuthorization(null);
        setMessage("The export could not be downloaded under current authority. Create a new confirmed export request.");
      }
    } finally {
      if (lease.isCurrent()) setWorking(null);
    }
  }

  async function withdrawExport() {
    const grant = downloadAuthorization;
    const { actor, lease } = captureLease();
    if (!grant || !lease.isCurrent() || downloadActor.current !== actor) return;
    setWorking("withdraw");
    try {
      const revoke = httpsCallable(getFirebaseFunctions(), "revokeStorytimeExportRequest");
      await awaitCurrentStorytimePrivacyActor(lease, () => revoke({ privacyRequestId: grant.privacyRequestId }));
      if (!lease.isCurrent() || downloadActor.current !== actor) return;
      downloadActor.current = null;
      setDownloadAuthorization(null);
      setMessage("The Storytime export request was withdrawn. Its download authority is revoked.");
    } catch {
      if (lease.isCurrent()) setMessage("The export withdrawal could not be confirmed. Try again.");
    } finally {
      if (lease.isCurrent()) setWorking(null);
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
            onChange={(event) => {
              const checked = event.target.checked;
              confirmationActor.current = checked ? getFirebaseAuth().currentUser : null;
              setConfirmation(checked);
            }}
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
      {downloadAuthorization ? (
        <div className="storytime-actions">
          <button className="storytime-button secondary" type="button" onClick={downloadExport}
            disabled={working !== null || !signedIn || !emailVerified}>
            Download private Storytime export
          </button>
          <button className="storytime-button secondary" type="button" onClick={withdrawExport}
            disabled={working !== null || !signedIn || !emailVerified}>
            Withdraw export request
          </button>
          <p className="storytime-helper">Download authorization expires {downloadAuthorization.expiresAt}.</p>
        </div>
      ) : null}
    </section>
  );
}
