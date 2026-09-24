export interface StorytimeSessionSnapshot {
  id: string;
  userId: string;
  title?: string;
  emotionalTone?: string;
  chapterIds?: string[];
  narratorScriptIds?: string[];
}

export function buildNarratorScriptRecord(args: {
  id: string;
  session: StorytimeSessionSnapshot;
  chapterId?: string;
  scriptType?: string;
  voiceTone?: string;
  text?: string;
  createdAt: string;
}) {
  return {
    id: args.id,
    userId: args.session.userId,
    sessionId: args.session.id,
    chapterId: args.chapterId || args.session.chapterIds?.[0],
    scriptType: args.scriptType || "memory_replay",
    voiceTone: args.voiceTone || "warm",
    text: args.text || `This private Storytime chapter, ${args.session.title || "your story"}, can be revisited in a ${args.voiceTone || "warm"} voice while preserving its ${args.session.emotionalTone || "reflective"} tone.`,
    providerStatus: "completed",
    createdAt: args.createdAt,
    updatedAt: args.createdAt
  };
}

export function buildEmotionalArcRecord(args: {
  id: string;
  session: StorytimeSessionSnapshot;
  arcLabel?: string;
  createdAt: string;
}) {
  return {
    id: args.id,
    userId: args.session.userId,
    sessionId: args.session.id,
    arcLabel: args.arcLabel || "gentle return",
    startTone: args.session.emotionalTone || "reflective",
    peakTone: "noticed",
    resolutionTone: "settled",
    summary: `This private story moves from ${args.session.emotionalTone || "reflective"} attention toward a gentler, more settled return.`,
    caution: "Reflective storytelling only.",
    providerStatus: "completed",
    createdAt: args.createdAt,
    updatedAt: args.createdAt
  };
}

export function buildTimelineEventRecord(args: {
  id: string;
  userId: string;
  sessionId: string;
  label: string;
  action: string;
  createdAt: string;
}) {
  return {
    id: args.id,
    userId: args.userId,
    sessionId: args.sessionId,
    eventType: "created",
    label: args.label,
    metadata: { action: args.action },
    createdAt: args.createdAt,
    updatedAt: args.createdAt
  };
}
