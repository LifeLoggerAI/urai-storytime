import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');

test('prepareVoiceoverJob validates request shape and auth-owned source records', () => {
  assert.match(source, /const PrepareVoiceoverJobSchema = z\.object/);
  assert.match(source, /sessionId: z\.string\(\)\.min\(1\)/);
  assert.match(source, /provider: z\.enum\(\["tts_provider", "elevenlabs"\]\)/);
  assert.match(source, /async function readOwnedStorySession/);
  assert.match(source, /db\.collection\("narratorScripts"\)\.doc\(narratorScriptId\)/);
  assert.match(source, /script\.userId !== userId \|\| script\.sessionId !== input\.sessionId/);
});

test('prepareVoiceoverJob binds explicit voiceover consent to a durable receipt', () => {
  assert.match(source, /consentSnapshot\?\.voiceover !== true/);
  assert.match(source, /STORYTIME_VOICEOVER_CONSENT_VERSION/);
  assert.match(source, /consentDecisionReceipts/);
  assert.match(source, /purpose: "storytime\.voiceover"/);
  assert.match(source, /decision: "authorized"/);
  assert.match(source, /decisionReceiptId: consentReceiptId/);
});

test('prepareVoiceoverJob queues the governed Jobs narrator worker instead of a local placeholder', () => {
  assert.match(source, /storytimeJobsBridgeRequest/);
  assert.match(source, /URAI_STORYTIME_JOBS_BRIDGE_TOKEN/);
  assert.match(source, /URAI_STORYTIME_JOBS_BRIDGE_URL/);
  assert.match(source, /externalSystem: "urai-jobs"/);
  assert.match(source, /externalJobId/);
  assert.match(source, /db\.collection\("voiceoverJobs"\)\.doc\(voiceoverJobId\)/);
  assert.match(source, /db\.collection\("storyExports"\)\.doc\(exportId\)/);
  assert.doesNotMatch(source, /media_worker_not_implemented/);
  assert.doesNotMatch(source, /voiceover_execution_blocked/);
});

test('voiceover lifecycle exposes bounded status cancel playback and deletion through the bridge', () => {
  assert.match(source, /const ManageVoiceoverJobSchema = z\.object/);
  assert.match(source, /"status", "cancel", "playback", "delete-output"/);
  assert.match(source, /export const manageVoiceoverJob = onCall/);
  assert.match(source, /Voiceover job is missing governed worker binding/);
  assert.match(index, /manageVoiceoverJob/);
});
