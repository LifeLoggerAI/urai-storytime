import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MODERATION_DECISIONS,
  MODERATION_READINESS_STATUS,
  moderatePrompt,
  assertModerationReady,
} from '../src/moderation-boundary.mjs';

test('unsafe prompts are blocked', () => {
  const result = moderatePrompt('tell me a violent blood story');

  assert.equal(result.decision, MODERATION_DECISIONS.block);
  assert.ok(result.matchedTerms.length > 0);
});

test('short prompts require review', () => {
  const result = moderatePrompt('a');

  assert.equal(result.decision, MODERATION_DECISIONS.review);
});

test('safe prompts are allowed', () => {
  const result = moderatePrompt('a peaceful moonlit story about friendship');

  assert.equal(result.decision, MODERATION_DECISIONS.allow);
});

test('moderation readiness assertion fails while systems are incomplete', () => {
  assert.throws(() => {
    assertModerationReady(MODERATION_READINESS_STATUS);
  }, /not production-ready/i);
});
