"use client";

import { httpsCallable } from "firebase/functions";
import { useMemo, useState } from "react";
import { getFirebaseFunctions } from "@/lib/firebase/client";
import type { NarratorScript, StoryChapter, StoryMoment, StorySession, StoryVersion } from "@/lib/storytime/types";

type RevisionResponse = {
  status?: string;
  versionId?: string;
  versionNumber?: number;
};

export function StoryRevisionEditor({
  session,
  chapter,
  moment,
  narrator,
  versions
}: {
  session: StorySession;
  chapter: StoryChapter | null;
  moment: StoryMoment | null;
  narrator: NarratorScript | null;
  versions: StoryVersion[];
}) {
  const [title, setTitle] = useState(session.title);
  const [chapterSummary, setChapterSummary] = useState(chapter?.summary ?? "");
  const [momentTitle, setMomentTitle] = useState(moment?.title ?? "");
  const [momentBody, setMomentBody] = useState(moment?.body ?? "");
  const [narratorText, setNarratorText] = useState(narrator?.text ?? "");
  const [editReason, setEditReason] = useState("User correction");
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const currentVersionId = session.currentVersionId;
  const versioned = Boolean(currentVersionId && session.versionNumber && chapter && moment && narrator);

  const edits = useMemo(() => ({
    title: title.trim() !== session.title ? title.trim().slice(0, 120) : undefined,
    chapterSummary: chapter && chapterSummary !== chapter.summary ? chapterSummary.slice(0, 800) : undefined,
    momentTitle: moment && momentTitle.trim() !== moment.title ? momentTitle.trim().slice(0, 140) : undefined,
    momentBody: moment && momentBody !== moment.body ? momentBody.slice(0, 1600) : undefined,
    narratorText: narrator && narratorText !== narrator.text ? narratorText.slice(0, 1200) : undefined
  }), [chapter, chapterSummary, moment, momentBody, momentTitle, narrator, narratorText, session.title, title]);

  const hasEdits = Object.values(edits).some((value) => value !== undefined);

  async function saveRevision() {
    if (!currentVersionId || !hasEdits) return;
    setWorking(true);
    setStatus(null);
    try {
      const save = httpsCallable<Record<string, unknown>, RevisionResponse>(
        getFirebaseFunctions(),
        "saveStoryRevision"
      );
      const result = await save({
        sessionId: session.id,
        expectedCurrentVersionId: currentVersionId,
        editReason: editReason.trim() || "User correction",
        ...edits
      });
      setStatus(`Saved immutable Storytime version ${result.data.versionNumber ?? "next"}.`);
      window.location.reload();
    } catch {
      setStatus("The edit was not saved. Reload before retrying so a newer version cannot be overwritten.");
    } finally {
      setWorking(false);
    }
  }

  async function restoreVersion(targetVersionId: string, versionNumber: number) {
    if (!currentVersionId) return;
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
        expectedCurrentVersionId: currentVersionId,
        targetVersionId
      });
      setStatus(`Restored as new immutable version ${result.data.versionNumber ?? "next"}.`);
      window.location.reload();
    } catch {
      setStatus("Restore did not complete. No immutable version was removed or overwritten.");
    } finally {
      setWorking(false);
    }
  }

  if (!versioned) {
    return (
      <section className="storytime-card storytime-stack" aria-label="Story editing">
        <p className="storytime-pill">Version history</p>
        <h2>Editing is unavailable for this older story</h2>
        <p>This session does not have the complete immutable Storytime version baseline. It remains readable and is not silently migrated.</p>
      </section>
    );
  }

  const ordered = [...versions].sort((left, right) => right.versionNumber - left.versionNumber);

  return (
    <section className="storytime-card storytime-stack" aria-label="Edit Storytime story" aria-busy={working}>
      <p className="storytime-pill">Edit · Version {session.versionNumber}</p>
      <h2>Correct the story without losing history</h2>
      <p>Saving creates a new immutable version. Editing and restoring do not call a generation provider, authorize provider spend, or enable public sharing.</p>

      <label className="storytime-field">
        Story title
        <input className="storytime-input" value={title} maxLength={120} required onChange={(event) => setTitle(event.target.value)} />
      </label>

      <label className="storytime-field">
        Chapter summary
        <textarea className="storytime-input" rows={3} maxLength={800} value={chapterSummary} onChange={(event) => setChapterSummary(event.target.value)} />
      </label>

      <label className="storytime-field">
        Moment title
        <input className="storytime-input" value={momentTitle} maxLength={140} required onChange={(event) => setMomentTitle(event.target.value)} />
      </label>

      <label className="storytime-field">
        Moment text
        <textarea className="storytime-input" rows={5} maxLength={1600} value={momentBody} onChange={(event) => setMomentBody(event.target.value)} />
      </label>

      <label className="storytime-field">
        Narrator text
        <textarea className="storytime-input" rows={4} maxLength={1200} value={narratorText} onChange={(event) => setNarratorText(event.target.value)} />
      </label>

      <label className="storytime-field">
        Why are you changing this version?
        <input className="storytime-input" value={editReason} maxLength={240} onChange={(event) => setEditReason(event.target.value)} />
      </label>

      <div className="storytime-actions">
        <button className="storytime-button" type="button" disabled={!hasEdits || working || !title.trim() || !momentTitle.trim()} onClick={saveRevision}>
          {working ? "Saving…" : "Save new version"}
        </button>
      </div>

      {status ? <p role="status" aria-live="polite">{status}</p> : null}

      <section className="storytime-stack" aria-label="Restore Storytime version">
        <h3>Restore an earlier version</h3>
        {ordered.map((version) => (
          <article className="storytime-card" key={version.id}>
            <strong>Version {version.versionNumber}</strong>
            <p>{version.reason.replace(/_/g, " ")} · {version.createdAt || "timestamp unavailable"}</p>
            {version.id === currentVersionId ? (
              <p className="storytime-helper">Current version</p>
            ) : (
              <button className="storytime-button secondary" type="button" disabled={working} onClick={() => restoreVersion(version.id, version.versionNumber)}>
                Restore as new version
              </button>
            )}
          </article>
        ))}
      </section>
    </section>
  );
}
