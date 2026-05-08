export const DEFAULT_BLOCKED_TERMS = Object.freeze([
  'violence',
  'blood',
  'weapon',
  'abuse',
  'hate',
]);

export function findBlockedTerms(text = '', blockedTerms = DEFAULT_BLOCKED_TERMS) {
  const lower = String(text).toLowerCase();
  return blockedTerms.filter((term) => lower.includes(term));
}
