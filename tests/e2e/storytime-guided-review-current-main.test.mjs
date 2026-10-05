import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');

test('Storytime guides details into a separate exact review and consent step', () => {
  for (const marker of [
    'type StoryStep = "details" | "review"',
    'useState<StoryStep>("details")',
    'Step 1 of 2',
    'Step 2 of 2',
    'Review story request',
    'Review and consent',
    'Back to details',
    'step !== "review"',
    'goToReview()'
  ]) assert.ok(home.includes(marker), `missing guided review marker: ${marker}`);
});

test('guided review preserves exact request invalidation and fail-closed consent', () => {
  assert.match(home, /reviewedFingerprint === requestReviewFingerprint/);
  assert.match(home, /Changing any field after this confirmation automatically invalidates the review/);
  assert.match(home, /Review the exact Storytime request before generation/);
  assert.match(home, /Explicit story-generation consent is required/);
  assert.match(home, /Consent to the configured story-generation provider is required/);
  assert.match(home, /memoryUse: false/);
  assert.match(home, /publicSharing: false/);
  assert.match(home, /voiceover: false/);
});

test('draft storage remains independent from generation and provider consent', () => {
  assert.match(home, /Draft storage is separate from story-generation and provider consent/);
  assert.match(home, /Generation and provider consent were not restored/);
  assert.match(home, /draftStorageConsent/);
  assert.match(home, /reviewedFingerprint/);
});
