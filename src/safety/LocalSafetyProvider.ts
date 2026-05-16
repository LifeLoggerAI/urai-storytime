import type { SafetyDecision } from '../types/safety';
import { blockedTerms, getSafeFallbackMessage, privateDataTerms, SAFETY_POLICY_VERSION } from './SafetyPolicy';

export class LocalSafetyProvider {
  check(input: string): SafetyDecision {
    const normalized = input.toLowerCase();
    const blockedHits = blockedTerms.filter((term) => normalized.includes(term));
    const privateDataHits = privateDataTerms.filter((term) => normalized.includes(term));
    const hits = [...blockedHits, ...privateDataHits];

    if (hits.length > 0) {
      return {
        safe: false,
        classification: hits.length > 2 ? 'needs_review' : 'blocked',
        blockedReasons: hits,
        redactions: privateDataHits,
        reviewRequired: hits.length > 2,
        policyVersion: SAFETY_POLICY_VERSION,
        parentMessage: getSafeFallbackMessage()
      };
    }

    return {
      safe: true,
      classification: 'safe',
      blockedReasons: [],
      redactions: [],
      reviewRequired: false,
      policyVersion: SAFETY_POLICY_VERSION,
      parentMessage: 'This story request passed the local safety check.'
    };
  }
}
