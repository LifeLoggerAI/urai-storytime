import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn = fs.readFileSync('functions/src/privacy-requests.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const controls = fs.readFileSync('src/components/storytime/PrivacyRequestControls.tsx', 'utf8');
const settings = fs.readFileSync('src/components/storytime/StorySettings.tsx', 'utf8');

test('privacy requests are verified, confirmed, idempotent, and server-owned', () => {
  for (const marker of [
    'email_verified',
    'confirmation: z.literal(true)',
    'type: z.enum(["export", "deletion"])',
    'scope: z.enum(["account", "story_session"])',
    'storytime-privacy-request-v1',
    'executionState: "not_started"',
    'completionReceiptId: null',
    'db.runTransaction'
  ]) assert.ok(fn.includes(marker), `missing privacy marker: ${marker}`);

  assert.match(index, /requestPrivacyOperation/);
  assert.match(rules, /match \/privacyRequests\/\{requestId\}/);
  const privacyRule = rules.slice(rules.indexOf('match /privacyRequests/{requestId}'), rules.indexOf('match /storySessions/{id}'));
  assert.match(privacyRule, /allow create: if false/);
});

test('settings expose truthful request controls without completion claims', () => {
  assert.match(settings, /PrivacyRequestControls/);
  assert.match(controls, /Request account export/);
  assert.match(controls, /Request account deletion/);
  assert.match(controls, /Export requests package Storytime-owned data immediately/);
  assert.match(controls, /never represented as complete without post-delete verification/);
  assert.match(controls, /No data has been deleted/);
});
