import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('functions/src/storytime.ts', 'utf8');

test('prepareVoiceoverJob validates request shape and auth-owned session access', () => {
  assert.match(source, /const PrepareVoiceoverJobSchema = z\.object/);
  assert.match(source, /sessionId: z\.string\(\)\.min\(1\)/);
  assert.match(source, /provider: z\.enum\(\["web_speech_fallback", "asset_factory", "tts_provider"\]\)/);
  assert.match(source, /async function readOwnedStorySession/);
  assert.match(source, /sessionSnap\.data\(\)\?\.userId !== userId/);
  assert.match(source, /permission-denied/);
});

test('prepareVoiceoverJob requires explicit voiceover consent and a narrator script', () => {
  assert.match(source, /consentSnapshot\?\.voiceover !== true/);
  assert.match(source, /Voiceover consent is required/);
  assert.match(source, /const narratorScriptId = input\.narratorScriptId \|\| session\.data\.narratorScriptIds\?\.\[0\]/);
  assert.match(source, /A narrator script is required before voiceover can be prepared/);
});

test('prepareVoiceoverJob fails closed while no governed media worker exists', () => {
  assert.match(source, /voiceover_execution_blocked/);
  assert.match(source, /media_worker_not_implemented/);
  assert.match(source, /Storytime voiceover\/media execution is disabled until a governed worker/);
  assert.match(source, /provider receipts, cancellation\/retry, private storage, and deletion lifecycle/);
  assert.doesNotMatch(source, /db\.collection\("voiceoverJobs"\)\.doc\(voiceoverJobId\)/);
  assert.doesNotMatch(source, /db\.collection\("storyExports"\)\.doc\(exportId\)/);
  assert.doesNotMatch(source, /Voiceover export queued/);
  assert.doesNotMatch(source, /fetch\(/);
});
