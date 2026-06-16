import type { EmotionalArcSummary, MemoryScene, NarratorScript, StoryChapter, StoryMoment, StorySession } from "./types";
import { explainWhyGenerated } from "./redaction";
import { moderateStoryText } from "./safety";

const DEFAULT_SOURCE = "A quiet day became a small story of attention, care, and return.";
const DEFAULT_SYMBOLIC_MOTIFS = ["star", "path", "glow"];
const MAX_TITLE_CHARS = 120;
const MAX_SOURCE_CHARS = 12000;
const MAX_MOMENT_BODY_CHARS = 1200;
const MAX_TONE_CHARS = 80;
const MAX_MOTIFS = 12;
const MAX_MOTIF_CHARS = 60;
const MAX_SOURCE_SIGNALS = 20;
const MAX_SOURCE_SIGNAL_CHARS = 80;

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function normalizeText(value: string | undefined, fallback: string, maxLength: number) {
  const normalized = value?.trim();
  return (normalized || fallback).slice(0, maxLength);
}

function normalizeList(values: string[] | undefined, fallback: string[], maxItems: number, maxItemLength: number) {
  const normalized = (values || [])
    .map((value) => value.trim().slice(0, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems);

  return normalized.length > 0 ? normalized : fallback;
}

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
  const title = normalizeText(input.title, "Untitled Story Session", MAX_TITLE_CHARS);
  const source = normalizeText(input.sourceText, DEFAULT_SOURCE, MAX_SOURCE_CHARS);
  const emotionalTone = normalizeText(input.emotionalTone, "reflective", MAX_TONE_CHARS);
  const symbolicMotifs = normalizeList(input.symbolicMotifs, DEFAULT_SYMBOLIC_MOTIFS, MAX_MOTIFS, MAX_MOTIF_CHARS);
  const sourceSignals = normalizeList(input.sourceSignals, [], MAX_SOURCE_SIGNALS, MAX_SOURCE_SIGNAL_CHARS);
  const moderation = moderateStoryText(source);

  const moment: StoryMoment = {
    id: momentId,
    userId: input.userId,
    sessionId,
    chapterId,
    order: 1,
    title: "The moment that asked to be remembered",
    body: source.slice(0, MAX_MOMENT_BODY_CHARS),
    moodTags: [emotionalTone],
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
    scenePrompt: `A cinematic but private URAI memory scene with ${symbolicMotifs.join(", ")} motifs.`,
    visualMood: emotionalTone,
    audioMood: "low, warm, spacious",
    symbolicObjects: symbolicMotifs,
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
    emotionalTone,
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
    startTone: emotionalTone,
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
    title,
    subtitle: "A private URAI story replay",
    status: moderation.safe ? "ready" : "draft",
    visibility: "private",
    sourceSignals,
    emotionalTone,
    symbolicMotifs,
    chapterIds: [chapterId],
    narratorScriptIds: [narratorScriptId],
    emotionalArcSummaryId: arcId,
    whyGenerated: explainWhyGenerated(sourceSignals),
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