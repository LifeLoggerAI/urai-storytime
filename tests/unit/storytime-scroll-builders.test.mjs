import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('functions/src/storytime-scroll-builders.ts', 'utf8');

test('weekly scroll builder creates queued scroll records', () => {
  assert.match(source, /export function buildWeeklyStoryScrollRecord/);
  assert.match(source, /title: "Weekly Story Scroll"/);
  assert.match(source, /providerStatus: "queued"/);
  assert.match(source, /sessionIds: args\.sessionIds/);
  assert.match(source, /weekStart: args\.weekStart/);
  assert.match(source, /weekEnd: args\.weekEnd/);
});

test('archive rebuild builder creates a timeline-compatible event', () => {
  assert.match(source, /export function buildArchiveRebuildEventRecord/);
  assert.match(source, /sessionId: args\.sessionIds\[0\] \|\| "user_archive"/);
  assert.match(source, /eventType: "created"/);
  assert.match(source, /label: "Story archive rebuild queued"/);
  assert.match(source, /action: "rebuildUserStoryArchive"/);
  assert.match(source, /sessionCount: args\.sessionIds\.length/);
});
