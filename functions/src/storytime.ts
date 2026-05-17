import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";

initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const GenerateStorySchema = z.object({
  title: z.string().min(1).max(120),
  sourceText: z.string().max(12000).optional(),
  emotionalTone: z.string().max(80).default("reflective"),
  symbolicMotifs: z.array(z.string().max(60)).max(12).default([]),
  sourceSignals: z.array(z.string().max(80)).max(20).default([]),
  consentSnapshot: z.object({
    storyGeneration: z.boolean(),
    voiceover: z.boolean(),
    publicSharing: z.boolean(),
    memoryUse: z.boolean()
  })
});

const blockedTerms = ["suicide", "self-harm", "kill", "blood", "weapon", "explicit", "nude", "abuse", "diagnosis"];

function requireAuth(uid?: string) {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in is required.");
}

function moderate(text: string) {
  const lower = text.toLowerCase();
  const hits = blockedTerms.filter((term) => lower.includes(term));
  return { safetyStatus: hits.length ? "needs_review" : "approved", hits };
}

function redact(text: string) {
  return text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "someone important")
    .replace(/\b\d{1,5}\s+[A-Za-z0-9 .'-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)\b/gi, "a private place")
    .replace(/\b\d{3}[-.)\s]?\d{3}[-.\s]?\d{4}\b/g, "a private number")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "a private email");
}

export const generateStorySession = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const userId = request.auth!.uid;
  const input = GenerateStorySchema.parse(request.data);

  if (!input.consentSnapshot.storyGeneration) {
    throw new HttpsError("failed-precondition", "Story generation consent is required.");
  }

  const createdAt = now();
  const sessionId = id("storySession");
  const chapterId = id("storyChapter");
  const momentId = id("storyMoment");
  const sceneId = id("memoryScene");
  const scriptId = id("narratorScript");
  const arcId = id("emotionalArc");
  const source = input.sourceText || "A quiet signal became a private URAI story.";
  const mod = moderate(source);

  const session = {
    id: sessionId,
    userId,
    title: input.title,
    subtitle: "A private URAI story replay",
    status: mod.hits.length ? "draft" : "ready",
    visibility: "private",
    sourceSignals: input.sourceSignals,
    emotionalTone: input.emotionalTone,
    symbolicMotifs: input.symbolicMotifs,
    chapterIds: [chapterId],
    narratorScriptIds: [scriptId],
    emotionalArcSummaryId: arcId,
    whyGenerated: input.sourceSignals.length
      ? `Generated from opted-in signals: ${input.sourceSignals.join(", ")}.`
      : "Generated from your direct Storytime input.",
    safetyStatus: mod.safetyStatus,
    consentSnapshot: input.consentSnapshot,
    createdAt,
    updatedAt: createdAt
  };

  const chapter = {
    id: chapterId,
    userId,
    sessionId,
    order: 1,
    title: "Chapter One: The Signal Becomes a Story",
    summary: source.slice(0, 500),
    emotionalTone: input.emotionalTone,
    momentIds: [momentId],
    narratorScriptId: scriptId,
    createdAt,
    updatedAt: createdAt
  };

  const moment = {
    id: momentId,
    userId,
    sessionId,
    chapterId,
    order: 1,
    title: "A moment worth remembering",
    body: source.slice(0, 1200),
    moodTags: [input.emotionalTone],
    peopleRefs: [],
    memorySceneId: sceneId,
    privacyLevel: "private",
    createdAt,
    updatedAt: createdAt
  };

  const scene = {
    id: sceneId,
    userId,
    sessionId,
    momentId,
    title: "Soft replay scene",
    scenePrompt: `A private URAI memory scene using motifs: ${input.symbolicMotifs.join(", ") || "soft light"}.`,
    visualMood: input.emotionalTone,
    audioMood: "warm, slow, spacious",
    symbolicObjects: input.symbolicMotifs,
    redacted: false,
    createdAt,
    updatedAt: createdAt
  };

  const narratorScript = {
    id: scriptId,
    userId,
    sessionId,
    chapterId,
    scriptType: "memory_replay",
    voiceTone: "warm",
    text: "This moment did not need to be loud to matter. URAI shaped it into a story so you could return to it with more tenderness and less noise.",
    safetyStatus: mod.safetyStatus,
    createdAt,
    updatedAt: createdAt
  };

  const arc = {
    id: arcId,
    userId,
    sessionId,
    arcLabel: "gentle return",
    startTone: input.emotionalTone,
    peakTone: "noticed",
    resolutionTone: "settled",
    summary: "The story moves from signal to meaning, then returns the user to a calmer frame.",
    caution: "Reflective storytelling only. Not a diagnosis or clinical interpretation.",
    createdAt,
    updatedAt: createdAt
  };

  const batch = db.batch();
  batch.set(db.collection("storySessions").doc(sessionId), session);
  batch.set(db.collection("storyChapters").doc(chapterId), chapter);
  batch.set(db.collection("storyMoments").doc(momentId), moment);
  batch.set(db.collection("memoryScenes").doc(sceneId), scene);
  batch.set(db.collection("narratorScripts").doc(scriptId), narratorScript);
  batch.set(db.collection("emotionalArcSummaries").doc(arcId), arc);
  await batch.commit();

  return { sessionId, status: session.status, safetyStatus: mod.safetyStatus };
});

export const createPublicStoryShare = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const userId = request.auth!.uid;
  const input = z.object({ sessionId: z.string().min(1), consent: z.boolean() }).parse(request.data);

  if (!input.consent) throw new HttpsError("failed-precondition", "Public sharing requires explicit consent.");

  const sessionSnap = await db.collection("storySessions").doc(input.sessionId).get();
  if (!sessionSnap.exists || sessionSnap.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Story not found.");
  }

  const session = sessionSnap.data()!;
  const shareId = id("publicStoryShare");
  const slug = `${String(session.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${shareId.slice(-6)}`;

  await db.collection("publicStoryShares").doc(shareId).set({
    id: shareId,
    userId,
    sessionId: input.sessionId,
    slug,
    title: redact(String(session.title)),
    safeSummary: redact(String(session.subtitle || session.title)),
    safeBody: "A private URAI story was transformed into a public-safe reflection.",
    revoked: false,
    createdAt: now(),
    updatedAt: now()
  });

  await sessionSnap.ref.update({ publicShareId: shareId, visibility: "public_safe", updatedAt: now() });
  return { shareId, slug };
});

export const generateNarratorScript = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  return { status: "queued", message: "Narrator script generation hook ready." };
});

export const generateEmotionalArcSummary = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  return { status: "queued", message: "Emotional arc summary hook ready." };
});

export const generateWeeklyStoryScroll = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  return { status: "queued", message: "Weekly Story Scroll hook ready." };
});

export const prepareVoiceoverJob = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  return { status: "queued", message: "Voiceover job hook ready." };
});

export const refreshStoryTimeline = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  return { status: "queued", message: "Story timeline refresh hook ready." };
});

export const rebuildUserStoryArchive = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  return { status: "queued", message: "Story archive rebuild hook ready." };
});
