export function buildWeeklyStoryScrollRecord(args: {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  sessionIds: string[];
  createdAt: string;
}) {
  return {
    id: args.id,
    userId: args.userId,
    weekStart: args.weekStart,
    weekEnd: args.weekEnd,
    title: "Weekly Story Scroll",
    summary: `Weekly Storytime scroll assembled from ${args.sessionIds.length} private session(s).`,
    sessionIds: args.sessionIds,
    providerStatus: "completed",
    createdAt: args.createdAt,
    updatedAt: args.createdAt
  };
}

export function buildArchiveRebuildEventRecord(args: {
  id: string;
  userId: string;
  sessionIds: string[];
  createdAt: string;
}) {
  return {
    id: args.id,
    userId: args.userId,
    sessionId: args.sessionIds[0] || "user_archive",
    eventType: "created",
    label: "Story archive snapshot rebuilt",
    metadata: {
      action: "rebuildUserStoryArchive",
      sessionCount: args.sessionIds.length
    },
    createdAt: args.createdAt,
    updatedAt: args.createdAt
  };
}
