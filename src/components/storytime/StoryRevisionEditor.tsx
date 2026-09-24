"use client";

import { httpsCallable } from "firebase/functions";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseFunctions } from "@/lib/firebase/client";
import type { NarratorScript, StoryChapter, StoryMoment, StorySession } from "@/lib/storytime/types";

type VersionSummary = {
  id: string;
  versionNumber: number;
  reason: string;
  editReason: string;
  restoredFromVersionId?: string | null;
  createdAt: string;
};

type ListVersionsResponse = {
  status?: string;
  versions?: VersionSummary[];
};

type RevisionResponse = {
  status?: string;
  versionId?: string;
  versionNumber?: number;
};

export function StoryRevisionEditor({
  session,
  chapters,
  moments,
  narratorScripts
}: {
  session: StorySession;
  chapters: StoryChapter[];
  moments: StoryMoment[];
  narratorScripts: NarratorScript[];
}) {
  const [title, setTitle] = useState(session.title);
  const [chapterSummaries, setChapterSummaries] = useState<Record<string, string>>(
    Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter.summary]))
  );
  const [momentBodies, setMomentBodies] = useState<Record<string, string>>(
    Object.fromEntries(moments.map((moment) => [moment.id, moment.body]))
  );
  const [narratorTexts, setNarratorTexts] = useState<Record<string, string>>(
    Object.fromEntries(narratorScripts.map((script) => [script.id, script.text]))
  );
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [editReason, setEditReason] = useState("User correction");
  const [status, setStatus] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const versioned = Boolean(session.currentVersionId && session.currentVersionNumber);

  useEffect(() => {
    if (!versioned) return;
    let active = true;

    void (async () => {
      try {
        const listVersions = httpsCallable<Record<string, unknown>, ListVersionsResponse>(
          getFirebaseFunctions(),
          "listStoryVersions"
        );
        const result = await listVersions({ sessionId: session.id });
        if (active) setVersions(result.data.versions ?? []);
      } catch {
        if (active) setStatus("Version history could not be loaded. No story data was changed.");
      }
    })();

    return () => {
      active = false;
    };
  }, [session.id, versioned]);

  const edits = useMemo(() => {
    const chapterEdits = chapters
      .filter((chapter) => (chapterSummaries[chapter.id] ?? "") !== chapter.summary)
      .map((chapter) => ({
        chapterId: chapter.id,
        summary: (chapterSummaries[chapter.id] ?? "").slice(0, 800)
      }));

    const momentEdits = moments
      .filter((moment) => (momentBodies[moment.id] ?? "") !== moment.body)
      .map((moment) => ({
        momentId: moment.id,
        body: (momentBodies[moment.id] ?? "").slice(0, 1600)
      }));

    const narratorEdits = narratorScripts
      .filter((script) => (narratorTexts[script.id] ?? "") !== script.text)
      .map((script) => ({
        narratorScriptId: script.id,
        text: (narratorTexts[script.id] ?? "").slice(0, 1200)
      }));

    return {
      title: title.trim() !== session.title ? title.trim().slice(0, 120) : undefined,
      chapterEdits,
      momentEdits,
      narratorEdits
    };
  }, [chapterSummaries, chapters, momentBodies, moments, narratorScripts, narratorTexts, session.title, title]);

  const hasEdits = Boolean(
    edits.title !== undefined
    || edits.chapterEdits.length
    || edits.momentEdits.length
    || edits.narratorEdits.length
  );

  async function saveRevision() {
    if (!session.currentVersionId || !hasEdits) return;
    setWorking(true);
    setStatus(null);

    try {
      const save = httpsCallable<Record<string, unknown>, RevisionResponse>(
        getFirebaseFunctions(),
        "saveStoryRevision"
      );
      const result = await save({
        sessionId: session.id,
        expectedCurrentVersionId: session.currentVersionId,
        editReason: editReason.trim() || "User correction",
        ...edits
      });
      setStatus(`Saved immutable Storytime version ${result.data.versionNumber ?? "next"}.`);
      window.location.reload();
    } catch {
      setStatus("The edit was not saved. Reload the story before retrying so you do not overwrite a newer version.");
    } finally {
      setWorking(false);
    }
  }

  async function restoreVersion(targetVersionId: string, versionNumber: number) {
    if (!session.currentVersionId) return;
    if (!window.confirm(`Restore Storytime version ${versionNumber}? The current version will remain in history.`)) return;

    setWorking(true);
    setStatus(null);
    try {
      const restore = httpsCallable<Record<string, unknown>, RevisionResponse>(
        getFirebaseFunctions(),
        "restoreStoryVersion"
      );
      const result = await restore({
        sessionId: session.id,
        expectedCurrentVersionId: session.currentVersionId,
        targetVersionId
      });
      setStatus(`Restored as new immutable version ${result.data.versionNumber ?? "next"}.`);
      window.location.reload();
    } catch {
      setStatus("Restore did not complete. No version history was intentionally removed.");
    } finally {
      setWorking(false);
    }
  }

  if (!versioned) {
    return (
      <section className="storytime-card storytime-stack" aria-label="Story version history">
        <p className="storytime-pill">Version history</p>
        <h2>Editing is unavailable for this older story</h2>
        <p>This session predates the immutable Storytime version baseline. It remains readable and is not silently migrated or overwritten.</p>
      </section>
    );
  }

  return (
    <section className="storytime-card storytime-stack" aria-label="Edit Storytime story">
      <p className="storytime-pill">Edit · Version {session.currentVersionNumber}</p>
      <h2>Correct the story without losing history</h2>
      <p>
        Saving creates a new immutable version. These edits are local Storytime corrections: they do not call a generation provider,
        authorize public sharing, or authorize media generation.
      </p>

      <label className="storytime-field">
        Story title
        <input
          className="storytime-input"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      {chapters.map((chapter) => (
        <label className="storytime-field" key={chapter.id}>
          {chapter.title} summary
          <textarea
            className="storytime-input"
            rows={3}
            maxLength={800}
            value={chapterSummaries[chapter.id] ?? ""}
            onChange={(event) => setChapterSummaries((current) => ({ ...current, [chapter.id]: event.target.value }))}
          />
        </label>
      ))}

      {moments.map((moment) => (
        <label className="storytime-field" key={moment.id}>
          {moment.title}
          <textarea
            className="storytime-input"
            rows={5}
            maxLength={1600}
            value={momentBodies[moment.id] ?? ""}
            onChange={(event) => setMomentBodies((current) => ({ ...current, [moment.id]: event.target.value }))}
          />
        </label>
      ))}

      {narratorScripts.map((script) => (
        <label className="storytime-field" key={script.id}>
          Narrator text
          <textarea
            className="storytime-input"
            rows={4}
            maxLength={1200}
            value={narratorTexts[script.id] ?? ""}
            onChange={(event) => setNarratorTexts((current) => ({ ...current, [script.id]: event.target.value }))}
          />
        </label>
      ))}

      <label className="storytime-field">
        Why are you changing this version?
        <input
          className="storytime-input"
          value={editReason}
          maxLength={240}
          onChange={(event) => setEditReason(event.target.value)}
        />
      </label>

      <div className="storytime-actions">
        <button className="storytime-button" type="button" disabled={!hasEdits || working || !title.trim()} onClick={saveRevision}>
          {working ? "Saving…" : "Save new version"}
        </button>
      </div>
      {status ? <p role="status">{status}</p> : null}

      <section className="storytime-stack" aria-label="Storytime version history">
        <h3>Version history</h3>
        {versions.length ? versions.map((version) => (
          <article className="storytime-card" key={version.id}>
            <h4>Version {version.versionNumber}</h4>
            <p>{version.editReason || version.reason} · {version.createdAt || "timestamp unavailable"}</p>
            {version.id !== session.currentVersionId ? (
              <button
                className="storytime-button secondary"
                type="button"
                disabled={working}
                onClick={() => restoreVersion(version.id, version.versionNumber)}
              >
                Restore as new version
              </button>
            ) : <p className="storytime-helper">Current version</p>}
          </article>
        )) : <p>No prior versions are available yet.</p>}
      </section>
    </section>
  );
}
