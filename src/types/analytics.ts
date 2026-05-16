export type AnalyticsEventName =
  | 'story_create_started'
  | 'story_create_blocked'
  | 'story_create_completed'
  | 'story_replay_started'
  | 'story_export_created'
  | 'onboarding_completed'
  | 'privacy_export_requested'
  | 'privacy_delete_requested'
  | 'admin_review_completed'
  | 'subscription_started'
  | 'subscription_cancelled';

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  familyId?: string;
  userId?: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};
