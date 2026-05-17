export type StoryVisibility = "private" | "public_safe";
export type StoryStatus = "draft" | "generating" | "ready" | "failed" | "archived";
export type SafetyStatus = "pending" | "approved" | "blocked" | "needs_review";
export type VoiceoverStatus = "none" | "queued" | "running" | "completed" | "failed";

export interface StorytimeBase {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorySession extends StorytimeBase {
  title: string;
  subtitle?: string;
  status: StoryStatus;
  visibility: StoryVisibility;
  sourceSignals: string[];
  emotionalTone: string;
  symbolicMotifs: string[];
  chapterIds: string[];
  narratorScriptIds: string[];
  emotionalArcSummaryId?: string;
  publicShareId?: string;
  whyGenerated: string;
  safetyStatus: SafetyStatus;
  consentSnapshot: {
    storyGeneration: boolean;
    voiceover: boolean;
    publicSharing: boolean;
    memoryUse: boolean;
  };
}

export interface StoryChapter extends StorytimeBase {
  sessionId: string;
  order: number;
  title: string;
  summary: string;
  emotionalTone: string;
  startDate?: string;
  endDate?: string;
  momentIds: string[];
  narratorScriptId?: string;
}

export interface StoryMoment extends StorytimeBase {
  sessionId: string;
  chapterId: string;
  order: number;
  title: string;
  body: string;
  moodTags: string[];
  peopleRefs: string[];
  locationLabel?: string;
  memorySceneId?: string;
  privacyLevel: "private" | "redacted" | "shareable";
}

export interface MemoryScene extends StorytimeBase {
  sessionId: string;
  momentId?: string;
  title: string;
  scenePrompt: string;
  visualMood: string;
  audioMood: string;
  symbolicObjects: string[];
  redacted: boolean;
}

export interface NarratorScript extends StorytimeBase {
  sessionId: string;
  chapterId?: string;
  scriptType:
    | "daily_summary"
    | "weekly_scroll"
    | "relationship_reflection"
    | "emotional_arc"
    | "recovery_chapter"
    | "memory_replay"
    | "ritual_narration"
    | "public_caption";
  voiceTone: "warm" | "gentle" | "grounded" | "reflective" | "playful";
  text: string;
  safetyStatus: SafetyStatus;
}

export interface RitualStorycard extends StorytimeBase {
  sessionId: string;
  title: string;
  ritualType: string;
  prompt: string;
  visualMotif: string;
  narratorLine: string;
  completedAt?: string;
}

export interface UserStoryPreferences extends StorytimeBase {
  defaultNarratorTone: string;
  allowMemoryUse: boolean;
  allowRelationshipThreads: boolean;
  allowVoiceoverJobs: boolean;
  allowPublicSharing: boolean;
  redactionLevel: "light" | "standard" | "strict";
}

export interface StoryExport extends StorytimeBase {
  sessionId: string;
  exportType: "image_card" | "pdf_scroll" | "voiceover" | "video_bundle" | "asset_factory_zip";
  status: "queued" | "running" | "completed" | "failed";
  storagePath?: string;
  downloadUrl?: string;
  assetFactoryJobId?: string;
}

export interface PublicStoryShare extends StorytimeBase {
  sessionId: string;
  slug: string;
  title: string;
  safeSummary: string;
  safeBody: string;
  expiresAt?: string;
  revoked: boolean;
}

export interface VoiceoverJob extends StorytimeBase {
  sessionId: string;
  narratorScriptId: string;
  status: VoiceoverStatus;
  provider: "web_speech_fallback" | "asset_factory" | "tts_provider";
  audioStoragePath?: string;
  captionStoragePath?: string;
  errorMessage?: string;
}

export interface TimelineReplayEvent extends StorytimeBase {
  sessionId: string;
  eventType: "created" | "played" | "exported" | "shared" | "revoked";
  label: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface EmotionalArcSummary extends StorytimeBase {
  sessionId: string;
  arcLabel: string;
  startTone: string;
  peakTone: string;
  resolutionTone: string;
  summary: string;
  caution: string;
}

export interface RelationshipStoryThread extends StorytimeBase {
  sessionId: string;
  relationshipKey: string;
  displayLabel: string;
  threadTitle: string;
  emotionalPattern: string;
  safeReflection: string;
  momentIds: string[];
  redacted: boolean;
}

export interface WeeklyStoryScroll extends StorytimeBase {
  weekStart: string;
  weekEnd: string;
  title: string;
  summary: string;
  sessionIds: string[];
  narratorScriptId?: string;
}

export interface MonthlyStoryScroll extends StorytimeBase {
  month: string;
  title: string;
  summary: string;
  sessionIds: string[];
  narratorScriptId?: string;
}

export interface StoryAnalyticsEvent extends StorytimeBase {
  eventName:
    | "story_created"
    | "story_played"
    | "chapter_opened"
    | "share_created"
    | "share_revoked"
    | "voiceover_queued"
    | "export_completed";
  sessionId?: string;
  metadata?: Record<string, string | number | boolean>;
}
