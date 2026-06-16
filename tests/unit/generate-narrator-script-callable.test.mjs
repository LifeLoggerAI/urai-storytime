import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('functions/src/generate-narrator-script.ts', 'utf8');

test('narrator script callable requires auth and validates request data', () => {
  assert.match(source, /request\.auth\?\.uid/);
  assert.match(source, /unauthenticated/);
  assert.match(source, /const RequestSchema = z\.object/);
  assert.match(source, /sessionId: z\.string\(\)\.min\(1\)/);
});

test('narrator script callable enforces owned session access', () => {
  assert.match(source, /async function ownedSession/);
  assert.match(source, /storySessions/);
  assert.match(source, /snap\.data\(\)\?\.userId !== userId/);
  assert.match(source, /permission-denied/);
});

test('narrator script callable writes narrator script and timeline event in a batch', () => {
  assert.match(source, /buildNarratorScriptRecord/);
  assert.match(source, /buildTimelineEventRecord/);
  assert.match(source, /db\.batch\(\)/);
  assert.match(source, /db\.collection\("narratorScripts"\)/);
  assert.match(source, /db\.collection\("timelineReplayEvents"\)/);
  assert.match(source, /await batch\.commit\(\)/);
});
