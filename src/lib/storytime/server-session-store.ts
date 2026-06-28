import type { EmotionalArcSummary, MemoryScene, NarratorScript, StoryChapter, StoryMoment, StorySession } from "./types";

export type StorySessionBundle = {
  session: StorySession;
  chapters: StoryChapter[];
  moments: StoryMoment[];
  scenes: MemoryScene[];
  narratorScripts: NarratorScript[];
  arc?: EmotionalArcSummary;
};

export type StorySessionLookupResult =
  | { status: "blocked"; message: string }
  | { status: "not-found"; message: string }
  | { status: "ready"; bundle: StorySessionBundle };

export async function getCloudStorySessionBundle(): Promise<StorySessionLookupResult> {
  return { status: "blocked", message: "Cloud session loading is not configured." };
}
