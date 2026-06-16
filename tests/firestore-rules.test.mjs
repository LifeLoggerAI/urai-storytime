import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rules = fs.readFileSync('firestore.rules', 'utf8');

test('Firestore rules contain deny-by-default fallback', () => {
  assert.ok(rules.includes('match /{document=**}'));
  assert.ok(rules.includes('allow read, write: if false'));
});

test('Firestore rules include admin protection', () => {
  assert.ok(rules.includes('request.auth.token.admin == true'));
});

test('Firestore rules include privacy request protections', () => {
  assert.ok(rules.includes('match /privacyRequests/{requestId}'));
});
