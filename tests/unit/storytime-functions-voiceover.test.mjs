import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const functions = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const media = fs.readFileSync('src/lib/storytime/media-job-contract.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');

test('voiceover/media work is not exposed as an unconsumed production callable', () => {
  assert.doesNotMatch(index, /prepareVoiceoverJob/);
  assert.doesNotMatch(functions, /export const prepareVoiceoverJob/);
  assert.doesNotMatch(functions, /voiceoverJobs/);
  assert.doesNotMatch(functions, /storyExports/);
  assert.doesNotMatch(functions, /Voiceover export queued/);
});

test('future media contract requires explicit consent and zero-spend hard-off authority', () => {
  assert.match(media, /storytime-media-job-v1/);
  assert.match(media, /mediaGeneration: true/);
  assert.match(media, /providerProcessing: true/);
  assert.match(media, /voiceUse\?: true/);
  assert.match(media, /providerSpendAuthorized: false/);
  assert.match(media, /publicReleaseAuthorized: false/);
  assert.match(media, /maxAuthorizedCost: 0/);
  assert.match(media, /state: "hard_off"/);
  assert.match(env, /STORYTIME_MEDIA_EXECUTION=false/);
});
