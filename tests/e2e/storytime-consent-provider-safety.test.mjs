import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const home = read('src/components/storytime/StorytimeHome.tsx');
const functions = read('functions/src/storytime.ts');
const provider = read('functions/src/story-provider.ts');
const index = read('functions/src/index.ts');

test('Storytime requires explicit adult/guardian and generation/provider consent', () => {
  assert.match(home, /adultGuardianAffirmed/);
  assert.match(home, /generationConsent/);
  assert.match(home, /providerProcessingConsent/);
  assert.match(home, /story-generation-consent-v1/);
  assert.match(home, /role: "adult_or_guardian"/);
  assert.match(home, /storyGeneration: generationConsent/);
  assert.match(home, /providerProcessing: providerProcessingConsent/);
  assert.doesNotMatch(home, /storyGeneration:\s*true/);
});

test('server enforces canonical audience, operator, consent version and idempotency', () => {
  for (const marker of [
    'requestId: z.string().min(8).max(128)',
    'audienceAgeBand: z.enum(["family", "preschool_3_5", "early_reader_6_8", "middle_grade_9_12"])',
    'role: z.literal("adult_or_guardian")',
    'affirmed: z.literal(true)',
    'storyGeneration: z.literal(true)',
    'providerProcessing: z.literal(true)',
    'consentVersion: z.literal(STORY_GENERATION_CONSENT_VERSION)',
    'storyGenerationRequests',
    'generation_reused',
    'status: "processing"',
    'status: "succeeded"'
  ]) {
    assert.match(functions, new RegExp(marker.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&')));
  }
});

test('provider execution is bounded, age-aware and post-checked without leaking raw provider bodies', () => {
  for (const marker of [
    'audienceInstruction(input.audienceAgeBand)',
    'new AbortController()',
    '20_000',
    'assertProviderOutputSafe(output)',
    'Story provider request failed with status'
  ]) {
    assert.match(provider, new RegExp(marker.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(provider, /response\.text\(\)/);
  assert.match(functions, /providerOutputText\(generated\)/);
  assert.match(functions, /generation_blocked_output_safety/);
  assert.match(functions, /Story generation could not be completed safely/);
});

test('only the hardened public-share lifecycle is exported', () => {
  assert.match(index, /public-story-share-lifecycle\.js/);
  assert.doesNotMatch(functions, /export const createPublicStoryShare/);
});
