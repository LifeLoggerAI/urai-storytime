import type { MemoryScene, NarratorScript, StoryChapter, StoryMoment, StorySession, StoryVersion } from "./types";

type OwnedSessionRecord = { id: string; userId: string; sessionId: string };

function exactRecord<T extends OwnedSessionRecord>(records: T[], id: string | undefined, session: StorySession): T | null {
  if (!id) return null;
  const matches = records.filter(record => record.id === id && record.userId === session.userId && record.sessionId === session.id);
  return matches.length === 1 ? matches[0] : null;
}

const unavailable = () => ({ chapter: null, moment: null, narrator: null, scene: null });

/** Selection comes from the committed version and record links, never query order. */
export function currentStorytimeRecords(bundle: {
  session: StorySession;
  chapters: StoryChapter[];
  moments: StoryMoment[];
  scripts: NarratorScript[];
  scenes: MemoryScene[];
  versions: StoryVersion[];
}): { chapter: StoryChapter | null; moment: StoryMoment | null; narrator: NarratorScript | null; scene: MemoryScene | null } {
  const { session } = bundle;
  const version = exactRecord(bundle.versions, session.currentVersionId, session);
  if (session.currentVersionId && (!version || version.schemaVersion !== "story-version-v1"
    || version.status !== "committed" || version.immutable !== true
    || version.versionNumber !== session.versionNumber || !version.snapshot)) return unavailable();

  const snapshot = version?.snapshot;
  const chapter = exactRecord(bundle.chapters, snapshot?.chapter?.id ?? session.chapterIds?.[0], session);
  const moment = exactRecord(bundle.moments, snapshot?.moment?.id ?? chapter?.momentIds?.[0], session);
  const narrator = exactRecord(bundle.scripts, snapshot?.narrator?.id ?? chapter?.narratorScriptId, session);
  if (!chapter || !moment || !narrator
    || !session.chapterIds?.includes(chapter.id) || !chapter.momentIds?.includes(moment.id)
    || moment.chapterId !== chapter.id || chapter.narratorScriptId !== narrator.id
    || narrator.chapterId !== chapter.id || !session.narratorScriptIds?.includes(narrator.id)) return unavailable();

  // A nontransactional browser read can straddle a revision commit. Mixed
  // records must not become editable against an unrelated immutable baseline.
  if (snapshot && (session.title !== snapshot.title || chapter.title !== snapshot.chapter?.title
    || chapter.summary !== snapshot.chapter?.summary || moment.title !== snapshot.moment?.title
    || moment.body !== snapshot.moment?.body || narrator.text !== snapshot.narrator?.text)) return unavailable();

  const selectedScene = exactRecord(bundle.scenes, moment.memorySceneId, session);
  const scene = selectedScene?.momentId === moment.id ? selectedScene : null;
  return { chapter, moment, narrator, scene };
}
