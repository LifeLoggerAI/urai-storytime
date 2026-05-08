import { SAFETY_CLASSIFICATION } from '../core/types.mjs';
import { DEFAULT_BLOCKED_TERMS, findBlockedTerms } from './moderationRules.mjs';

export class LocalSafetyProvider {
  constructor({ blockedTerms = DEFAULT_BLOCKED_TERMS } = {}) {
    this.blockedTerms = blockedTerms;
  }

  reviewText(text = '') {
    const hits = findBlockedTerms(text, this.blockedTerms);
    return {
      safe: hits.length === 0,
      classification: hits.length === 0 ? SAFETY_CLASSIFICATION.SAFE : SAFETY_CLASSIFICATION.BLOCKED,
      blockedReasons: hits,
      message: hits.length === 0 ? 'Safe for local demo generation.' : `Please remove unsafe words: ${hits.join(', ')}`,
    };
  }

  precheckStoryRequest(request) {
    return this.reviewText(request?.prompt || '');
  }

  postcheckStory(story) {
    return this.reviewText(`${story?.title || ''} ${story?.body || ''}`);
  }
}
