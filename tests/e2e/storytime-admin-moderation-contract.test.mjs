import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/storytime/admin-moderation-contract.ts', 'utf8');

test('Storytime moderation handoff is versioned, Admin-bound, and hard-off', () => {
  for (const marker of [
    'storytime-admin-moderation-v1',
    'urai.storytime.moderation.review.requested',
    'sourceSystem: "urai-storytime"',
    'destinationSystem: "urai-admin"',
    'activationState: "hard_off"',
    'containsRawStoryContent: false'
  ]) assert.ok(source.includes(marker), `missing moderation contract marker: ${marker}`);
});

test('moderation handoff uses hashes and reason codes rather than raw content', () => {
  assert.match(source, /contentSha256: string/);
  assert.match(source, /userIdHash: string/);
  assert.match(source, /sessionIdHash\?: string/);
  assert.match(source, /reasonCodes: string\[\]/);
  assert.match(source, /must be a SHA-256 hex digest/);
  assert.doesNotMatch(source, /storyBody:|sourceText:|promptText:|rawContent:/);
});

test('Admin decision receipt requires authority, separation of duties, and retained evidence', () => {
  assert.match(source, /sourceSystem: "urai-admin"/);
  assert.match(source, /decision: StorytimeModerationDecision/);
  assert.match(source, /separationOfDutiesSatisfied: boolean/);
  assert.match(source, /receiptId: string/);
  assert.match(source, /auditEventId: string/);
  assert.match(source, /policyVersion: string/);
  assert.match(source, /Storytime moderation decisions must originate from URAI Admin/);
  assert.match(source, /lacks required separation of duties/);
});
