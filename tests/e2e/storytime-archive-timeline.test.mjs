import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const timeline = fs.readFileSync('functions/src/refresh-story-timeline.ts', 'utf8');
const archive = fs.readFileSync('functions/src/rebuild-user-story-archive.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');

test('timeline refresh exports the real ownership-checked persistence callable', () => {
  assert.match(index, /refresh-story-timeline\.js/);
  assert.match(timeline, /assertOwnedSession/);
  assert.match(timeline, /timelineReplayEvents/);
  assert.match(timeline, /status: "completed"/);
  assert.doesNotMatch(timeline, /hook ready/i);
});

test('archive rebuild persists a bounded server-owned snapshot rather than a fake queued hook', () => {
  assert.match(index, /rebuild-user-story-archive\.js/);
  assert.match(archive, /MAX_ARCHIVE_SESSIONS = 200/);
  assert.match(archive, /where\("userId", "==", userId\)/);
  assert.match(archive, /storytime-archive-snapshot-v1/);
  assert.match(archive, /storyArchiveSnapshots/);
  assert.match(archive, /status: "completed"/);
  assert.doesNotMatch(archive, /hook ready/i);
  assert.match(rules, /match \/storyArchiveSnapshots\/\{id\} \{ allow read, write: if false; \}/);
});
