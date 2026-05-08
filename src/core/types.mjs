export const AGE_BANDS = Object.freeze({
  PRESCHOOL: 'preschool_3_5',
  EARLY_READER: 'early_reader_6_8',
  MIDDLE_GRADE: 'middle_grade_9_12',
  TEEN: 'teen_13_17',
  ADULT_DEMO: 'adult_demo',
});

export const STORY_RUN_STATUS = Object.freeze({
  PENDING: 'pending',
  SAFE_REJECTED: 'safe_rejected',
  GENERATED: 'generated',
  FAILED: 'failed',
});

export const SAFETY_CLASSIFICATION = Object.freeze({
  SAFE: 'safe',
  BLOCKED: 'blocked',
  REVIEW: 'review',
});

export function createStoryId(now = Date.now()) {
  return `story_${now}`;
}

export function normalizeStoryRequest(input = {}) {
  return {
    childName: String(input.childName || 'Ari').trim() || 'Ari',
    theme: String(input.theme || 'Moon Garden').trim() || 'Moon Garden',
    mood: String(input.mood || 'gentle').trim() || 'gentle',
    narrator: String(input.narrator || 'Firefly Guide').trim() || 'Firefly Guide',
    prompt: String(input.prompt || '').trim(),
    ageBand: String(input.ageBand || AGE_BANDS.ADULT_DEMO),
  };
}
