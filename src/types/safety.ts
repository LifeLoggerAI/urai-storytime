export type SafetyClassification = 'safe' | 'caution' | 'blocked' | 'needs_review';

export type SafetyDecision = {
  safe: boolean;
  classification: SafetyClassification;
  blockedReasons: string[];
  redactions: string[];
  reviewRequired: boolean;
  policyVersion: string;
  parentMessage: string;
};

export type SafetyReview = {
  id: string;
  familyId: string;
  targetType: 'prompt' | 'story' | 'scene' | 'creator_submission';
  targetId: string;
  ageBand: string;
  classification: SafetyClassification;
  blockedReasons: string[];
  reviewStatus: 'auto_approved' | 'auto_blocked' | 'pending_human' | 'human_approved' | 'human_rejected';
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
};

export type ModerationEvent = {
  id: string;
  familyId?: string;
  targetType: string;
  targetId: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_parent_review' | 'escalated' | 'resolved';
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
};
