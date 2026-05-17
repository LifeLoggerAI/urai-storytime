import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rules = fs.readFileSync('storage.rules', 'utf8');

test('Storage rules contain deny-by-default fallback', () => {
  assert.ok(rules.includes('match /{allPaths=**}'));
  assert.ok(rules.includes('allow read, write: if false'));
});

test('Storage rules isolate family assets', () => {
  assert.ok(rules.includes('match /families/{familyId}/stories/{storyId}/{fileName}'));
});

test('Storage rules protect moderation assets', () => {
  assert.ok(rules.includes('match /moderation/{fileName}'));
});
