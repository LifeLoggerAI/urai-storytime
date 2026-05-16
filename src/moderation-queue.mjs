export const MODERATION_QUEUE_STATUS = Object.freeze({
  queueConfigured: false,
  reviewerWorkflowConfigured: false,
  escalationConfigured: false,
});

export function createModerationQueueItem({ storyId, reason, severity = 'review' } = {}) {
  if (!storyId || !reason) {
    throw new Error('storyId and reason are required for moderation queue items.');
  }

  return {
    id: crypto.randomUUID(),
    storyId,
    reason,
    severity,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}
