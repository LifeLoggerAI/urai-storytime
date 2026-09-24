import { createHash } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { auditLog } from "./audit-log.js";
import { generateStoryWithProvider, getStoryProviderReadiness, type StoryProviderOutput } from "./story-provider.js";

initializeApp();

const db = getFirestore();
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const MAX_GENERATIONS_PER_HOUR = Number(process.env.STORYTIME_MAX_GENERATIONS_PER_HOUR || 6);
const MAX_GENERATIONS_PER_DAY = Number(process.env.STORYTIME_MAX_GENERATIONS_PER_DAY || 24);
const STORY_GENERATION_CONSENT_VERSION = "story-generation-consent-v1";

const GenerateStorySchema = z.object({
  requestId: z.string().min(8).max(128).regex(/^[A-Za-z0-9._-]+$/),
  locale: z.literal("en-US"),
  title: z.string().min(1).max(120),
  sourceText: z.string().max(12000).optional(),
  emotionalTone: z.string().max(80).default("reflective"),
  symbolicMotifs: z.array(z.string().max(60)).max(12).default([]),
  sourceSignals: z.array(z.string().max(80)).max(20).default([]),
  audienceAgeBand: z.enum(["family", "preschool_3_5", "early_reader_6_8", "middle_grade_9_12"]),
  operator: z.object({
    role: z.literal("adult_or_guardian"),
    affirmed: z.literal(true)
  }),
  consentSnapshot: z.object({
    storyGeneration: z.literal(true),
    providerProcessing: z.literal(true),
    consentVersion: z.literal(STORY_GENERATION_CONSENT_VERSION),
    voiceover: z.boolean(),
    publicSharing: z.boolean(),
    memoryUse: z.boolean()
  })
});

const safetyPatterns = [
  { code: "self_harm", pattern: /\b(?:suicide|self[- ]?harm|kill myself|kill yourself)\b/i },
  { code: "graphic_violence", pattern: /\b(?:blood|weapon|murder|gore|graphic violence)\b/i },
  { code: "sexual_content", pattern: /\b(?:nude|nudity|explicit sexual|sexual content|porn|rape)\b/i },
  { code: "abuse_exploitation", pattern: /\b(?:abuse|exploit(?:ation|ative)?)\b/i },
  { code: "diagnostic_request", pattern: /\b(?:diagnosis|diagnose me|diagnose this)\b/i },
  { code: "prompt_injection", pattern: /(?:ignore (?:all|previous|prior) instructions|reveal .*system prompt|bypass .*safety)/i }
] as const;

function requireAuth(uid?: string) {
  if (!uid) {
    auditLog({ event: "generation_blocked_auth" });
    throw new HttpsError("unauthenticated", "Sign in is required.");
  }
}

function requireVerifiedAdultAccount(emailVerified?: unknown) {
  if (emailVerified !== true) {
    throw new HttpsError("failed-precondition", "Verify the adult/guardian account email before creating cloud stories.");
  }
}

function allowLocalBuilder() {
  return process.env.STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER === "true" && process.env.NODE_ENV !== "production";
}

function requireConfiguredStoryProvider(userId?: string) {
  const readiness = getStoryProviderReadiness();
  if (readiness.ready || allowLocalBuilder()) return readiness;
  auditLog({ event: "provider_unavailable", userId, provider: readiness.provider, errorCode: "missing_provider_config" });
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

function generationRequestId(userId: string, requestId: string) {
  return `${userId}_${requestId}`;
}

async function claimGenerationRequest(userId: string, input: z.infer<typeof GenerateStorySchema>) {
  const requestRef = db.collection("storyGenerationRequests").doc(generationRequestId(userId, input.requestId));
  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(requestRef);
    if (snapshot.exists) {
      const data = snapshot.data() || {};
      if (data.userId !== userId) {
        throw new HttpsError("permission-denied", "Story generation request is unavailable.");
      }
      if (data.status === "succeeded" && typeof data.sessionId === "string") {
        return { requestRef, reusedSessionId: data.sessionId as string };
      }
      if (data.status === "processing") {
        throw new HttpsError("already-exists", "This Storytime request is already being processed.");
      }
    }

    const timestamp = now();
    transaction.set(requestRef, {
      userId,
      requestId: input.requestId,
      status: "processing",
      audienceAgeBand: input.audienceAgeBand,
      operatorRole: input.operator.role,
      consentVersion: input.consentSnapshot.consentVersion,
      createdAt: snapshot.data()?.createdAt || timestamp,
      updatedAt: timestamp
    }, { merge: true });
    return { requestRef, reusedSessionId: null };
  });
  return result;
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
      auditLog({ event: "generation_blocked_quota", userId, quotaScope: "hour", errorCode: "hourly_limit" });
      throw new HttpsError("resource-exhausted", "Hourly Storytime generation limit reached. Try again later.");
    }
    if (dailyCount >= MAX_GENERATIONS_PER_DAY) {
      auditLog({ event: "generation_blocked_quota", userId, quotaScope: "day", errorCode: "daily_limit" });
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
  const reasonCodes = safetyPatterns.filter(({ pattern }) => pattern.test(text)).map(({ code }) => code);
  return { safetyStatus: reasonCodes.length ? "needs_review" : "approved", reasonCodes };
}

function contentFingerprint(text: string) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function enqueueModerationReview(args: {
  userId: string;
  requestId: string;
  stage: "input" | "output";
  reasonCodes: string[];
  content: string;
}) {
  const moderationId = `${args.userId}_${args.requestId}_${args.stage}`;
  const timestamp = now();
  await db.collection("moderation").doc(moderationId).set({
    schemaVersion: "storytime-moderation-review-v1",
    userId: args.userId,
    requestId: args.requestId,
    stage: args.stage,
    status: "pending",
    reasonCodes: args.reasonCodes,
    contentSha256: contentFingerprint(args.content),
    containsRawStoryContent: false,
    createdAt: timestamp,
    updatedAt: timestamp
  }, { merge: true });
}

function providerOutputText(output: StoryProviderOutput) {
  return [
    output.chapterTitle,
    output.chapterSummary,
    output.momentTitle,
    output.momentBody,
    output.narratorText,
    output.scenePrompt,
    output.arcLabel,
    output.arcSummary
  ].join(" ");
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
  requireVerifiedAdultAccount(request.auth?.token.email_verified);
  const userId = request.auth!.uid;
  auditLog({ event: "generation_requested", userId });
  const input = GenerateStorySchema.parse(request.data);
  const source = input.sourceText || "A quiet signal became a private URAI story.";
  const inputSafetyText = `${input.title} ${source} ${input.emotionalTone} ${input.symbolicMotifs.join(" ")}`;
  const mod = moderate(inputSafetyText);
  if (mod.reasonCodes.length) {
    await enqueueModerationReview({
      userId,
      requestId: input.requestId,
      stage: "input",
      reasonCodes: mod.reasonCodes,
      content: inputSafetyText
    });
    auditLog({ event: "generation_blocked_safety", userId, safetyStatus: mod.safetyStatus, errorCode: "unsafe_input" });
    throw new HttpsError("failed-precondition", "Story input requires safety review before generation.");
  }

  const readiness = requireConfiguredStoryProvider(userId);
  const generationRequest = await claimGenerationRequest(userId, input);
  if (generationRequest.reusedSessionId) {
    auditLog({ event: "generation_reused", userId, sessionId: generationRequest.reusedSessionId });
    return {
      sessionId: generationRequest.reusedSessionId,
      status: "ready",
      safetyStatus: "approved",
      reused: true
    };
  }

  try {
    await enforceGenerationQuota(userId);
  } catch (error) {
    await generationRequest.requestRef.set({
      status: "failed",
      errorCode: error instanceof HttpsError ? error.code : "quota_error",
      updatedAt: now()
    }, { merge: true });
    throw error;
  }
  let generated: StoryProviderOutput;
  try {
    generated = readiness.ready
      ? await generateStoryWithProvider({
          title: input.title,
          sourceText: source,
          emotionalTone: input.emotionalTone,
          symbolicMotifs: input.symbolicMotifs,
          locale: input.locale,
          audienceAgeBand: input.audienceAgeBand
        })
      : fallbackProviderOutput(input, source);
  } catch (error) {
    await generationRequest.requestRef.set({
      status: "failed",
      errorCode: error instanceof Error ? error.name : "unknown",
      updatedAt: now()
    }, { merge: true });
    auditLog({ event: "provider_failed", userId, provider: readiness.provider, errorCode: error instanceof Error ? error.name : "unknown" });
    throw new HttpsError("internal", "Story generation could not be completed safely. Please try again.");
  }

  const outputSafetyText = providerOutputText(generated);
  const outputModeration = moderate(outputSafetyText);
  if (outputModeration.reasonCodes.length) {
    await enqueueModerationReview({
      userId,
      requestId: input.requestId,
      stage: "output",
      reasonCodes: outputModeration.reasonCodes,
      content: outputSafetyText
    });
    await generationRequest.requestRef.set({
      status: "needs_review",
      safetyStatus: outputModeration.safetyStatus,
      updatedAt: now()
    }, { merge: true });
    auditLog({ event: "generation_blocked_output_safety", userId, provider: readiness.provider, safetyStatus: outputModeration.safetyStatus, errorCode: "unsafe_output" });
    throw new HttpsError("failed-precondition", "Generated story output requires safety review before it can be saved or displayed.");
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
    requestId: input.requestId,
    locale: input.locale,
    audienceAgeBand: input.audienceAgeBand,
    operator: input.operator,
    provenance: {
      schemaVersion: "storytime-provenance-v1",
      sourceType: "direct_storytime_input",
      sourceId: input.requestId,
      consentVersion: input.consentSnapshot.consentVersion,
      aiGenerated: readiness.ready,
      deterministicBuilder: !readiness.ready,
      fictionalized: true,
      edited: false,
      factualStatus: "creative_derivative_not_source_evidence"
    },
    whyGenerated: input.sourceSignals.length
      ? `Generated from opted-in signals: ${input.sourceSignals.join(", ")}.`
      : "Generated from your direct Storytime input.",
    safetyStatus: outputModeration.safetyStatus,
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
    safetyStatus: outputModeration.safetyStatus,
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
  batch.set(generationRequest.requestRef, {
    status: "succeeded",
    sessionId,
    safetyStatus: outputModeration.safetyStatus,
    provider: session.provider,
    updatedAt: createdAt
  }, { merge: true });
  await batch.commit();

  auditLog({ event: "story_persisted", userId, sessionId, provider: session.provider, safetyStatus: outputModeration.safetyStatus });
  return {
    sessionId,
    status: session.status,
    safetyStatus: outputModeration.safetyStatus,
    provider: session.provider,
    reused: false
  };
});
