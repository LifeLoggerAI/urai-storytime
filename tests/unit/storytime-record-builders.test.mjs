import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('functions/src/storytime-record-builders.ts', 'utf8');

test('record builders create queued narrator script records', () => {
  assert.match(source, /export function buildNarratorScriptRecord/);
  assert.match(source, /providerStatus: "queued"/);
  assert.match(source, /scriptType: args\.scriptType \|\| "memory_replay"/);
  assert.match(source, /voiceTone: args\.voiceTone \|\| "warm"/);
  assert.match(source, /chapterId: args\.chapterId \|\| args\.session\.chapterIds\?\.\[0\]/);
});

test('record builders create queued emotional arc records', () => {
  assert.match(source, /export function buildEmotionalArcRecord/);
  assert.match(source, /arcLabel: args\.arcLabel \|\| "gentle return"/);
  assert.match(source, /startTone: args\.session\.emotionalTone \|\| "reflective"/);
  assert.match(source, /caution: "Reflective storytelling only\."/);
});

test('record builders create timeline event records with action metadata', () => {
  assert.match(source, /export function buildTimelineEventRecord/);
  assert.match(source, /eventType: "created"/);
  assert.match(source, /metadata: \{ action: args\.action \}/);
});
