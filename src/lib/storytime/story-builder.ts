import type { EmotionalArcSummary, MemoryScene, NarratorScript, StoryChapter, StoryMoment, StorySession } from "./types";
import { explainWhyGenerated } from "./redaction";
import { moderateStoryText } from "./safety";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function buildStorySession(input: {
  userId: string;
  title: string;
  sourceText?: string;
  emotionalTone?: string;
  symbolicMotifs?: string[];
  sourceSignals?: string[];
  consentSnapshot?: StorySession["consentSnapshot"];
}): {
  session: StorySession;
  chapters: StoryChapter[];
  moments: StoryMoment[];
  scenes: MemoryScene[];
  narratorScripts: NarratorScript[];
  arc: EmotionalArcSummary;
} {
  const createdAt = now();
  const sessionId = id("storySession");
  const chapterId = id("storyChapter");
  const momentId = id("storyMoment");
  const sceneId = id("memoryScene");
  const narratorScriptId = id("narratorScript");
  const arcId = id("emotionalArc");
  const source = input.sourceText?.trim() || "A quiet day became a small story of attention, care, and return.";
  const moderation = moderateStoryText(source);

  const moment: StoryMoment = {
    id: momentId,
    userId: input.userId,
    sessionId,
    chapterId,
    order: 1,
    title: "The moment that asked to be remembered",
    body: source.slice(0, 1200),
    moodTags: [input.emotionalTone || "reflective"],
    peopleRefs: [],
    privacyLevel: "private",
    memorySceneId: sceneId,
    createdAt,
    updatedAt: createdAt
  };

  const scene: MemoryScene = {
    id: sceneId,
    userId: input.userId,
    sessionId,
    momentId,
    title: "A soft replay scene",
    scenePrompt: `A cinematic but private URAI memory scene with ${input.symbolicMotifs?.join(", ") || "soft light"} motifs.`,
    visualMood: input.emotionalTone || "gentle",
    audioMood: "low, warm, spacious",
    symbolicObjects: input.symbolicMotifs || ["small star", "quiet path"],
    redacted: false,
    createdAt,
    updatedAt: createdAt
  };

  const chapter: StoryChapter = {
    id: chapterId,
    userId: input.userId,
    sessionId,
    order: 1,
    title: "Chapter One: The Signal Becomes a Story",
    summary: "A private moment was shaped into a gentle narrative replay.",
    emotionalTone: input.emotionalTone || "reflective",
    momentIds: [momentId],
    narratorScriptId,
    createdAt,
    updatedAt: createdAt
  };

  const narrator: NarratorScript = {
    id: narratorScriptId,
    userId: input.userId,
    sessionId,
    chapterId,
    scriptType: "memory_replay",
    voiceTone: "warm",
    text: "This moment did not need to be loud to matter. URAI shaped it into a small story so you could return to it with more tenderness and less noise.",
    safetyStatus: moderation.status,
    createdAt,
    updatedAt: createdAt
  };

  const arc: EmotionalArcSummary = {
    id: arcId,
    userId: input.userId,
    sessionId,
    arcLabel: "gentle return",
    startTone: input.emotionalTone || "quiet",
    peakTone: "noticed",
    resolutionTone: "settled",
    summary: "The story moves from signal to meaning, then returns the user to a calmer frame.",
    caution: "This is reflective storytelling, not a clinical interpretation.",
    createdAt,
    updatedAt: createdAt
  };

  const session: StorySession = {
    id: sessionId,
    userId: input.userId,
    title: input.title,
    subtitle: "A private URAI story replay",
    status: moderation.safe ? "ready" : "draft",
    visibility: "private",
    sourceSignals: input.sourceSignals || [],
    emotionalTone: input.emotionalTone || "reflective",
    symbolicMotifs: input.symbolicMotifs || ["star", "path", "glow"],
    chapterIds: [chapterId],
    narratorScriptIds: [narratorScriptId],
    emotionalArcSummaryId: arcId,
    whyGenerated: explainWhyGenerated(input.sourceSignals || []),
    safetyStatus: moderation.status,
    consentSnapshot:
      input.consentSnapshot || {
        storyGeneration: true,
        voiceover: false,
        publicSharing: false,
        memoryUse: false
      },
    createdAt,
    updatedAt: createdAt
  };

  return { session, chapters: [chapter], moments: [moment], scenes: [scene], narratorScripts: [narrator], arc };
}
