import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const functions = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const narrator = fs.readFileSync('functions/src/generate-narrator-script.ts', 'utf8');
const arc = fs.readFileSync('functions/src/generate-emotional-arc-summary.ts', 'utf8');
const weekly = fs.readFileSync('functions/src/generate-weekly-story-scroll.ts', 'utf8');
const scrollBuilders = fs.readFileSync('functions/src/storytime-scroll-builders.ts', 'utf8');
const contract = fs.readFileSync('src/lib/storytime/media-job-contract.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');

test('unconsumed voiceover queue is not deployed as a callable', () => {
  assert.doesNotMatch(index, /prepareVoiceoverJob/);
  assert.doesNotMatch(functions, /export const prepareVoiceoverJob/);
  assert.doesNotMatch(functions, /voiceoverJobs/);
  assert.doesNotMatch(functions, /Voiceover export queued/);
});

test('synchronous Storytime-derived records report completed after persistence', () => {
  assert.match(narrator, /status: "completed"/);
  assert.match(narrator, /Narrator script generated/);
  assert.match(arc, /status: "completed"/);
  assert.match(weekly, /status: "completed"/);
  assert.match(scrollBuilders, /providerStatus: "local_compiled"/);
  assert.doesNotMatch(scrollBuilders, /Queued weekly scroll/);
});

test('future Storytime media work is a zero-spend hard-off contract', () => {
  for (const marker of [
    'storytime-media-job-v1',
    'state: "hard_off"',
    'providerSpendAuthorized: false',
    'publicReleaseAuthorized: false',
    'maxAuthorizedCost: 0',
    'mediaGeneration: true',
    'providerProcessing: true',
    'voiceUse?: true',
    'STORYTIME_MEDIA_EXECUTION'
  ]) assert.ok(contract.includes(marker), `missing media hard-off marker: ${marker}`);
  assert.match(env, /STORYTIME_MEDIA_EXECUTION=false/);
});
