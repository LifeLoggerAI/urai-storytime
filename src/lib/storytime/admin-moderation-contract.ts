export const STORYTIME_ADMIN_MODERATION_SCHEMA_VERSION = "storytime-admin-moderation-v1" as const;

export type StorytimeModerationStage = "input" | "output";
export type StorytimeModerationDecision = "escalate" | "close_blocked";
export type StorytimeModerationActivation = "hard_off" | "approved_for_staging" | "approved_for_production";

export interface StorytimeModerationHandoff {
  schemaVersion: typeof STORYTIME_ADMIN_MODERATION_SCHEMA_VERSION;
  eventType: "urai.storytime.moderation.review.requested";
  sourceSystem: "urai-storytime";
  destinationSystem: "urai-admin";
  activationState: StorytimeModerationActivation;
  moderationRecordId: string;
  storyRequestId: string;
  stage: StorytimeModerationStage;
  reasonCodes: string[];
  contentSha256: string;
  containsRawStoryContent: false;
  subject: {
    userIdHash: string;
    sessionIdHash?: string;
  };
  provenance: {
    sourceRepo: "LifeLoggerAI/urai-storytime";
    sourceSchema: "storytime-moderation-review-v1";
    consentVersion?: string;
  };
  requestedAt: string;
}

export interface StorytimeModerationDecisionReceipt {
  schemaVersion: typeof STORYTIME_ADMIN_MODERATION_SCHEMA_VERSION;
  eventType: "urai.storytime.moderation.review.decided";
  sourceSystem: "urai-admin";
  destinationSystem: "urai-storytime";
  moderationRecordId: string;
  decision: StorytimeModerationDecision;
  releaseAuthorized: false;
  secureContentReviewAvailable: false;
  decisionId: string;
  decidedAt: string;
  reviewerAuthority: {
    principalId: string;
    role: "moderator" | "safety_reviewer" | "admin";
    separationOfDutiesSatisfied: boolean;
  };
  evidence: {
    receiptId: string;
    auditEventId: string;
    policyVersion: string;
  };
  containsRawStoryContent: false;
}

function requireSha256(value: string, label: string) {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error(`${label} must be a SHA-256 hex digest.`);
}

export function buildHardOffStorytimeModerationHandoff(args: {
  moderationRecordId: string;
  storyRequestId: string;
  stage: StorytimeModerationStage;
  reasonCodes: string[];
  contentSha256: string;
  userIdHash: string;
  sessionIdHash?: string;
  consentVersion?: string;
  requestedAt?: string;
}): StorytimeModerationHandoff {
  if (!args.moderationRecordId.trim() || !args.storyRequestId.trim()) {
    throw new Error("Storytime moderation handoff requires record and request identity.");
  }
  if (args.reasonCodes.length === 0 || args.reasonCodes.some((code) => !code.trim())) {
    throw new Error("Storytime moderation handoff requires at least one reason code.");
  }
  requireSha256(args.contentSha256, "contentSha256");
  requireSha256(args.userIdHash, "userIdHash");
  if (args.sessionIdHash) requireSha256(args.sessionIdHash, "sessionIdHash");

  return {
    schemaVersion: STORYTIME_ADMIN_MODERATION_SCHEMA_VERSION,
    eventType: "urai.storytime.moderation.review.requested",
    sourceSystem: "urai-storytime",
    destinationSystem: "urai-admin",
    activationState: "hard_off",
    moderationRecordId: args.moderationRecordId,
    storyRequestId: args.storyRequestId,
    stage: args.stage,
    reasonCodes: [...new Set(args.reasonCodes)].sort(),
    contentSha256: args.contentSha256.toLowerCase(),
    containsRawStoryContent: false,
    subject: {
      userIdHash: args.userIdHash.toLowerCase(),
      sessionIdHash: args.sessionIdHash?.toLowerCase()
    },
    provenance: {
      sourceRepo: "LifeLoggerAI/urai-storytime",
      sourceSchema: "storytime-moderation-review-v1",
      consentVersion: args.consentVersion
    },
    requestedAt: args.requestedAt || new Date().toISOString()
  };
}

export function assertStorytimeModerationDecisionReceipt(receipt: StorytimeModerationDecisionReceipt) {
  if (receipt.schemaVersion !== STORYTIME_ADMIN_MODERATION_SCHEMA_VERSION) {
    throw new Error("Unsupported Storytime moderation receipt schema.");
  }
  if (receipt.sourceSystem !== "urai-admin" || receipt.destinationSystem !== "urai-storytime") {
    throw new Error("Storytime moderation decisions must originate from URAI Admin.");
  }
  if (receipt.containsRawStoryContent !== false || receipt.releaseAuthorized !== false || receipt.secureContentReviewAvailable !== false) {
    throw new Error("Storytime moderation receipts cannot authorize release without a governed secure content-review channel.");
  }
  if (!receipt.reviewerAuthority.separationOfDutiesSatisfied) {
    throw new Error("Storytime moderation decision lacks required separation of duties.");
  }
  if (!receipt.evidence.receiptId || !receipt.evidence.auditEventId || !receipt.evidence.policyVersion) {
    throw new Error("Storytime moderation decision lacks evidence authority.");
  }
}
