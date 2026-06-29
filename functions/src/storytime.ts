import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { generateStoryWithProvider, getStoryProviderReadiness, type StoryProviderOutput } from "./story-provider.js";

initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const MAX_GENERATIONS_PER_HOUR = Number(process.env.STORYTIME_MAX_GENERATIONS_PER_HOUR || 6);
const MAX_GENERATIONS_PER_DAY = Number(process.env.STORYTIME_MAX_GENERATIONS_PER_DAY || 24);

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

const PrepareVoiceoverJobSchema = z.object({
  sessionId: z.string().min(1),
  narratorScriptId: z.string().min(1).optional(),
  provider: z.enum(["web_speech_fallback", "asset_factory", "tts_provider"]).default("asset_factory")
});

const blockedTerms = ["suicide", "self-harm", "kill", "blood", "weapon", "explicit", "nude", "abuse", "diagnosis"];

function requireAuth(uid?: string) {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in is required.");
}

function allowLocalBuilder() {
  return process.env.STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER === "true" && process.env.NODE_ENV !== "production";
}

function requireConfiguredStoryProvider() {
  const readiness = getStoryProviderReadiness();
  if (readiness.ready || allowLocalBuilder()) return readiness;
  throw new HttpsError(
    "failed-precondition",
    `Story generation provider is not configured. Missing: ${readiness.missing.join(", ")}. The callable is deployed-safe but blocked until real provider credentials and review are enabled.`
  );
}

function quotaWindowId(date: Date, scope: "hour" | "day") {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  return scope === "hour" ? `${year}${month}${day}${hour}` : `${year}${month}${day}`;
}

async function enforceGenerationQuota(userId: string) {
  const current = new Date();
  const hourlyRef = db.collection("storytimeUsageCounters").doc(`${userId}_hour_${quotaWindowId(current, "hour")}`);
  const dailyRef = db.collection("storytimeUsageCounters").doc(`${userId}_day_${quotaWindowId(current, "day")}`);

  await db.runTransaction(async (transaction) => {
    const [hourlySnap, dailySnap] = await Promise.all([transaction.get(hourlyRef), transaction.get(dailyRef)]);
    const hourlyCount = Number(hourlySnap.data()?.count || 0);
    const dailyCount = Number(dailySnap.data()?.count || 0);

    if (hourlyCount >= MAX_GENERATIONS_PER_HOUR) {
      throw new HttpsError("resource-exhausted", "Hourly Storytime generation limit reached. Try again later.");
    }
    if (dailyCount >= MAX_GENERATIONS_PER_DAY) {
      throw new HttpsError("resource-exhausted", "Daily Storytime generation limit reached. Try again tomorrow.");
    }

    transaction.set(hourlyRef, { userId, scope: "hour", count: FieldValue.increment(1), updatedAt: now() }, { merge: true });
    transaction.set(dailyRef, { userId, scope: "day", count: FieldValue.increment(1), updatedAt: now() }, { merge: true });
  });
}

function fallbackProviderOutput(input: z.infer<typeof GenerateStorySchema>, source: string): StoryProviderOutput {
  return {
    chapterTitle: "Chapter One: The Signal Becomes a Story",
    chapterSummary: source.slice(0, 500),
    momentTitle: "A moment worth remembering",
    momentBody: source.slice(0, 1200),
    narratorText: "This moment did not need to be loud to matter. URAI shaped it into a story so you could return to it with more tenderness and less noise.",
    scenePrompt: `A private URAI memory scene using motifs: ${input.symbolicMotifs.join(", ") || "soft light"}.`,
    visualMood: input.emotionalTone,
    audioMood: "warm, slow, spacious",
    arcLabel: "gentle return",
    arcSummary: "The story moves from signal to meaning, then returns the user to a calmer frame.",
    peakTone: "noticed",
    resolutionTone: "settled"
  };
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

async function readOwnedStorySession(sessionId: string, userId: string) {
  const sessionSnap = await db.collection("storySessions").doc(sessionId).get();
  if (!sessionSnap.exists || sessionSnap.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Story not found.");
  }

  return { ref: sessionSnap.ref, data: sessionSnap.data()! };
}

export const generateStorySession = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const userId = request.auth!.uid;
  const input = GenerateStorySchema.parse(request.data);

  if (!input.consentSnapshot.storyGeneration) {
    throw new HttpsError("failed-precondition", "Story generation consent is required.");
  }

  const source = input.sourceText || "A quiet signal became a private URAI story.";
  const mod = moderate(`${input.title} ${source} ${input.emotionalTone} ${input.symbolicMotifs.join(" ")}`);
  if (mod.hits.length) {
    throw new HttpsError("failed-precondition", "Story input requires safety review before generation.");
  }

  await enforceGenerationQuota(userId);
  const readiness = requireConfiguredStoryProvider();
  let generated: StoryProviderOutput;
  try {
    generated = readiness.ready
      ? await generateStoryWithProvider({ title: input.title, sourceText: source, emotionalTone: input.emotionalTone, symbolicMotifs: input.symbolicMotifs })
      : fallbackProviderOutput(input, source);
  } catch (error) {
    throw new HttpsError("internal", error instanceof Error ? error.message : "Story provider failed.");
  }

  const createdAt = now();
  const sessionId = id("storySession");
  const chapterId = id("storyChapter");
  const momentId = id("storyMoment");
  const sceneId = id("memoryScene");
  const scriptId = id("narratorScript");
  const arcId = id("emotionalArc");

  const session = {
    id: sessionId,
    userId,
    title: input.title,
    subtitle: "A private URAI story replay",
    status: "ready",
    visibility: "private",
    sourceSignals: input.sourceSignals,
    emotionalTone: input.emotionalTone,
    symbolicMotifs: input.symbolicMotifs,
    chapterIds: [chapterId],
    narratorScriptIds: [scriptId],
    emotionalArcSummaryId: arcId,
    provider: readiness.ready ? readiness.provider : "local_builder",
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
    title: generated.chapterTitle,
    summary: generated.chapterSummary,
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
    title: generated.momentTitle,
    body: generated.momentBody,
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
    scenePrompt: generated.scenePrompt,
    visualMood: generated.visualMood,
    audioMood: generated.audioMood,
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
    text: generated.narratorText,
    safetyStatus: mod.safetyStatus,
    createdAt,
    updatedAt: createdAt
  };

  const arc = {
    id: arcId,
    userId,
    sessionId,
    arcLabel: generated.arcLabel,
    startTone: input.emotionalTone,
    peakTone: generated.peakTone,
    resolutionTone: generated.resolutionTone,
    summary: generated.arcSummary,
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

  return { sessionId, status: session.status, safetyStatus: mod.safetyStatus, provider: session.provider };
});

export const createPublicStoryShare = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const userId = request.auth!.uid;
  const input = z.object({ sessionId: z.string().min(1), consent: z.boolean() }).parse(request.data);

  if (!input.consent) throw new HttpsError("failed-precondition", "Public sharing requires explicit consent.");

  const session = await readOwnedStorySession(input.sessionId, userId);
  const shareId = id("publicStoryShare");
  const slug = `${String(session.data.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${shareId.slice(-6)}`;

  await db.collection("publicStoryShares").doc(shareId).set({
    id: shareId,
    userId,
    sessionId: input.sessionId,
    slug,
    title: redact(String(session.data.title)),
    safeSummary: redact(String(session.data.subtitle || session.data.title)),
    safeBody: "A private URAI story was transformed into a public-safe reflection.",
    revoked: false,
    createdAt: now(),
    updatedAt: now()
  });

  await session.ref.update({ publicShareId: shareId, visibility: "public_safe", updatedAt: now() });
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
  const userId = request.auth!.uid;
  const input = PrepareVoiceoverJobSchema.parse(request.data);
  const session = await readOwnedStorySession(input.sessionId, userId);

  if (session.data.consentSnapshot?.voiceover !== true) {
    throw new HttpsError("failed-precondition", "Voiceover consent is required.");
  }

  const createdAt = now();
  const voiceoverJobId = id("voiceoverJob");
  const exportId = id("storyExport");
  const timelineEventId = id("timelineReplayEvent");
  const narratorScriptId = input.narratorScriptId || session.data.narratorScriptIds?.[0];

  if (!narratorScriptId) {
    throw new HttpsError("failed-precondition", "A narrator script is required before voiceover can be queued.");
  }

  const voiceoverJob = {
    id: voiceoverJobId,
    userId,
    sessionId: input.sessionId,
    narratorScriptId,
    status: "queued",
    provider: input.provider,
    createdAt,
    updatedAt: createdAt
  };

  const storyExport = {
    id: exportId,
    userId,
    sessionId: input.sessionId,
    exportType: input.provider === "asset_factory" ? "asset_factory_zip" : "voiceover",
    status: "queued",
    assetFactoryJobId: input.provider === "asset_factory" ? voiceoverJobId : null,
    createdAt,
    updatedAt: createdAt
  };

  const batch = db.batch();
  batch.set(db.collection("voiceoverJobs").doc(voiceoverJobId), voiceoverJob);
  batch.set(db.collection("storyExports").doc(exportId), storyExport);
  batch.set(db.collection("timelineReplayEvents").doc(timelineEventId), {
    id: timelineEventId,
    userId,
    sessionId: input.sessionId,
    eventType: "exported",
    label: "Voiceover export queued",
    metadata: {
      provider: input.provider,
      voiceoverJobId,
      exportId
    },
    createdAt,
    updatedAt: createdAt
  });
  await batch.commit();

  return { status: "queued", voiceoverJobId, exportId, provider: input.provider };
});

export const refreshStoryTimeline = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  return { status: "queued", message: "Story timeline refresh hook ready." };
});

export const rebuildUserStoryArchive = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  return { status: "queued", message: "Story archive rebuild hook ready." };
});
