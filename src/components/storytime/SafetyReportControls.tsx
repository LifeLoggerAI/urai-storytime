"use client";

import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { getFirebaseFunctions, isStorytimeCloudModeEnabled } from "@/lib/firebase/client";
import type { StorySession } from "@/lib/storytime/types";

const CATEGORIES = [
  ["unsafe_content", "Unsafe or inappropriate content"],
  ["privacy_concern", "Privacy concern"],
  ["wrong_personal_detail", "Incorrect personal detail"],
  ["sharing_concern", "Sharing concern"],
  ["other_safety_concern", "Other safety concern"]
] as const;

type Category = (typeof CATEGORIES)[number][0];

type ReportResult = {
  reportId?: string;
  moderationId?: string;
  status?: string;
  reused?: boolean;
  emergencyMonitoringProvided?: boolean;
};

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `safety-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function SafetyReportControls({ session }: { session: StorySession }) {
  const cloudReady = isStorytimeCloudModeEnabled();
  const [category, setCategory] = useState<Category>("unsafe_content");
  const [confirmed, setConfirmed] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function submitReport() {
    setMessage(null);
    setError(false);
    if (!confirmed) {
      setError(true);
      setMessage("Confirm that you want to send this safety report.");
      return;
    }

    setWorking(true);
    try {
      const callable = httpsCallable<Record<string, unknown>, ReportResult>(
        getFirebaseFunctions(),
        "reportStorytimeSafetyConcern"
      );
      const result = await callable({
        requestId: createRequestId(),
        sessionId: session.id,
        category,
        confirmation: true
      });

      if (result.data.status !== "submitted") throw new Error("Unexpected safety-report status.");
      setConfirmed(false);
      setMessage(
        result.data.reused
          ? "This safety report was already received. The existing report remains in the governed review queue."
          : "Safety report received. The story stays private and the report contains only the selected category and operational fingerprints."
      );
    } catch {
      setError(true);
      setMessage("The safety report could not be submitted. No new report has been represented as received.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Storytime safety report">
      <p className="storytime-pill">Safety</p>
      <h2>Report a concern</h2>
      <p>
        Report a concern about this private Storytime session without copying the story body into the moderation queue.
        Storytime reporting is not emergency monitoring or clinical support.
      </p>

      {!cloudReady ? (
        <p className="storytime-helper" role="status">
          Safety reporting is unavailable until the verified cloud runtime is enabled.
        </p>
      ) : (
        <>
          <label className="storytime-field">
            Concern category
            <select
              className="storytime-input"
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
              disabled={working}
            >
              {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="storytime-field">
            <span>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={working}
              />{" "}
              I want to send this category-only safety report for this Storytime session.
            </span>
          </label>

          <div className="storytime-actions">
            <button
              className="storytime-button secondary"
              type="button"
              onClick={submitReport}
              disabled={working || !confirmed}
            >
              {working ? "Submitting report…" : "Submit safety report"}
            </button>
          </div>
        </>
      )}

      {message ? (
        <p
          className={error ? "storytime-error" : "storytime-helper"}
          role={error ? "alert" : "status"}
          aria-live={error ? "assertive" : "polite"}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
