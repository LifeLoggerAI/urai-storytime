import type { AgeBand } from '../types/story';

export const SAFETY_POLICY_VERSION = 'urai-storytime-safety-v1';

export const blockedTerms = [
  'violence',
  'blood',
  'weapon',
  'gun',
  'knife',
  'abuse',
  'hate',
  'kill',
  'murder',
  'suicide',
  'self-harm',
  'sex',
  'nude',
  'drugs',
  'alcohol',
  'grooming',
  'kidnap',
  'stalker',
  'ignore safety',
  'bypass rules',
  'system prompt',
  'developer message',
  'hidden instruction'
];

export const privateDataTerms = [
  'home address',
  'school name',
  'phone number',
  'social security',
  'exact location',
  'medical diagnosis'
];

export const ageBandRules: Record<AgeBand, { maxWords: number; tone: string; intensity: string }> = {
  preschool_3_5: { maxWords: 450, tone: 'simple, warm, soothing', intensity: 'very low' },
  early_reader_6_8: { maxWords: 700, tone: 'gentle, imaginative, clear', intensity: 'low' },
  middle_grade_9_12: { maxWords: 1000, tone: 'adventurous but safe', intensity: 'moderate' },
  teen_13_17: { maxWords: 1200, tone: 'reflective, hopeful, age-aware', intensity: 'moderate' },
  adult_demo: { maxWords: 1000, tone: 'calm demo', intensity: 'moderate' }
};

export function getSafeFallbackMessage(): string {
  return 'That idea needs a softer bedtime version. Try a gentle adventure about courage, friendship, wonder, or rest.';
}
