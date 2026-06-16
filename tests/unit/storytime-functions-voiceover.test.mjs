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

test('prepareVoiceoverJob requires voiceover consent and a narrator script before queueing', () => {
  assert.match(source, /consentSnapshot\?\.voiceover !== true/);
  assert.match(source, /Voiceover consent is required/);
  assert.match(source, /const narratorScriptId = input\.narratorScriptId \|\| session\.data\.narratorScriptIds\?\.\[0\]/);
  assert.match(source, /A narrator script is required before voiceover can be queued/);
});

test('prepareVoiceoverJob persists voiceoverJobs, storyExports, and timelineReplayEvents atomically', () => {
  assert.match(source, /const batch = db\.batch\(\)/);
  assert.match(source, /db\.collection\("voiceoverJobs"\)\.doc\(voiceoverJobId\)/);
  assert.match(source, /db\.collection\("storyExports"\)\.doc\(exportId\)/);
  assert.match(source, /db\.collection\("timelineReplayEvents"\)\.doc\(timelineEventId\)/);
  assert.match(source, /await batch\.commit\(\)/);
});

test('prepareVoiceoverJob records export and provider metadata without calling external media providers', () => {
  assert.match(source, /exportType: input\.provider === "asset_factory" \? "asset_factory_zip" : "voiceover"/);
  assert.match(source, /assetFactoryJobId: input\.provider === "asset_factory" \? voiceoverJobId : null/);
  assert.match(source, /eventType: "exported"/);
  assert.match(source, /label: "Voiceover export queued"/);
  assert.doesNotMatch(source, /fetch\(/);
});
