import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const builder = fs.readFileSync('src/lib/storytime/story-builder.ts', 'utf8');

test('deterministic Storytime builder never invents story-generation consent', () => {
  assert.match(builder, /consentSnapshot: StorySession\["consentSnapshot"\]/);
  assert.match(builder, /input\.consentSnapshot\.storyGeneration !== true/);
  assert.match(builder, /Explicit story-generation consent is required/);
  assert.match(builder, /consentSnapshot: input\.consentSnapshot/);
  assert.doesNotMatch(builder, /input\.consentSnapshot \|\|/);
  assert.doesNotMatch(builder, /storyGeneration: true,/);
});
