import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('functions/src/refresh-story-timeline.ts', 'utf8');

test('timeline refresh callable requires auth and validates session input', () => {
  assert.match(source, /request\.auth\?\.uid/);
  assert.match(source, /unauthenticated/);
  assert.match(source, /const RequestSchema = z\.object/);
  assert.match(source, /sessionId: z\.string\(\)\.min\(1\)/);
});

test('timeline refresh callable verifies the target session is owned', () => {
  assert.match(source, /async function assertOwnedSession/);
  assert.match(source, /storySessions/);
  assert.match(source, /snap\.data\(\)\?\.userId !== userId/);
  assert.match(source, /permission-denied/);
});

test('timeline refresh callable writes a timelineReplayEvents record', () => {
  assert.match(source, /buildTimelineEventRecord/);
  assert.match(source, /action: "refreshStoryTimeline"/);
  assert.match(source, /db\.collection\("timelineReplayEvents"\)/);
  assert.match(source, /timelineEventId/);
});
