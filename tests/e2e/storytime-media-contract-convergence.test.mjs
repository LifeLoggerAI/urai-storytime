import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const functions = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const contract = fs.readFileSync('src/lib/storytime/media-job-contract.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');

test('Storytime media execution is zero-spend and hard-off by contract', () => {
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
  ]) assert.ok(contract.includes(marker), `missing media contract marker: ${marker}`);
  assert.match(env, /STORYTIME_MEDIA_EXECUTION=false/);
});

test('current voiceover callable remains a fail-closed compatibility surface with no job writes', () => {
  assert.match(functions, /export const prepareVoiceoverJob/);
  assert.match(functions, /voiceover_execution_blocked/);
  assert.match(functions, /media_worker_not_implemented/);
  assert.match(functions, /Storytime voiceover\/media execution is disabled until a governed worker/);
  assert.doesNotMatch(functions, /db\.collection\("voiceoverJobs"\)\.doc\(voiceoverJobId\)/);
  assert.doesNotMatch(functions, /db\.collection\("storyExports"\)\.doc\(exportId\)/);
});
