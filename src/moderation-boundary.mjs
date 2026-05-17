// URAI Storytime moderation boundary scaffold
//
// This module defines deterministic safety gates for the local/demo layer
// and documents the boundary required before production AI generation.
// It does not replace provider-side moderation, human review, or policy review.

export const MODERATION_READINESS_STATUS = Object.freeze({
  promptPrecheckVerified: false,
  outputModerationVerified: false,
  humanReviewQueueVerified: false,
  auditLoggingVerified: false,
  childSafetyPolicyVerified: false,
});

export const MODERATION_DECISIONS = Object.freeze({
  allow: 'allow',
  block: 'block',
  review: 'review',
});

const blockedTerms = [
  'blood',
  'gore',
  'weapon',
  'kill',
  'suicide',
  'self harm',
  'explicit',
];

export function moderatePrompt(prompt = '') {
  const normalized = String(prompt).toLowerCase();
  const matchedTerms = blockedTerms.filter((term) => normalized.includes(term));

  if (matchedTerms.length > 0) {
    return {
      decision: MODERATION_DECISIONS.block,
      matchedTerms,
      reason: 'Prompt contains content that is not allowed for child-safe story generation.',
    };
  }

  if (normalized.trim().length < 3) {
    return {
      decision: MODERATION_DECISIONS.review,
      matchedTerms: [],
      reason: 'Prompt is too short to classify safely.',
    };
  }

  return {
    decision: MODERATION_DECISIONS.allow,
    matchedTerms: [],
    reason: 'Prompt passed deterministic local-demo safety checks.',
  };
}

export function assertModerationReady(status = MODERATION_READINESS_STATUS) {
  const missing = Object.entries(status)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Moderation is not production-ready. Missing: ${missing.join(', ')}`);
  }

  return true;
}
