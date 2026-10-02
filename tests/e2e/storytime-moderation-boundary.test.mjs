import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const functions = fs.readFileSync('functions/src/storytime.ts', 'utf8');

test('moderation uses reason-coded patterns rather than a raw kill substring block', () => {
  assert.match(functions, /code: "self_harm"/);
  assert.match(functions, /code: "graphic_violence"/);
  assert.match(functions, /code: "sexual_content"/);
  assert.match(functions, /code: "abuse_exploitation"/);
  assert.match(functions, /code: "diagnostic_request"/);
  assert.match(functions, /code: "prompt_injection"/);
  assert.doesNotMatch(functions, /const blockedTerms = \[/);
});

test('unsafe input and output create server-side review records without raw story text', () => {
  assert.match(functions, /storytime-moderation-review-v1/);
  assert.match(functions, /contentSha256/);
  assert.match(functions, /containsRawStoryContent: false/);
  assert.match(functions, /stage: "input"/);
  assert.match(functions, /stage: "output"/);
  assert.match(functions, /status: "pending"/);
  assert.match(functions, /generation_blocked_output_safety/);
});
