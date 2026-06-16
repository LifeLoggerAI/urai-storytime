import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('functions/src/generate-weekly-story-scroll.ts', 'utf8');

test('weekly story scroll callable requires auth and validates request data', () => {
  assert.match(source, /request\.auth\?\.uid/);
  assert.match(source, /unauthenticated/);
  assert.match(source, /const RequestSchema = z\.object/);
  assert.match(source, /sessionIds: z\.array\(z\.string\(\)\.min\(1\)\)\.min\(1\)\.max\(14\)/);
});

test('weekly story scroll callable verifies every source session is owned', () => {
  assert.match(source, /async function assertOwnedSession/);
  assert.match(source, /storySessions/);
  assert.match(source, /snap\.data\(\)\?\.userId !== userId/);
  assert.match(source, /for \(const sessionId of input\.sessionIds\)/);
});

test('weekly story scroll callable writes queued weeklyStoryScrolls record', () => {
  assert.match(source, /buildWeeklyStoryScrollRecord/);
  assert.match(source, /db\.collection\("weeklyStoryScrolls"\)/);
  assert.match(source, /weeklyStoryScrollId/);
  assert.match(source, /sessionCount: ownedSessionIds\.length/);
});
