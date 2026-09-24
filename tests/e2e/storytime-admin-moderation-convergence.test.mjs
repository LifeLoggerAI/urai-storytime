import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract = fs.readFileSync('src/lib/storytime/admin-moderation-contract.ts', 'utf8');
const operations = fs.readFileSync('functions/src/moderation-operations.ts', 'utf8');

test('cross-repo moderation contract matches current fail-closed Admin operations', () => {
  assert.match(contract, /storytime-admin-moderation-v1/);
  assert.match(contract, /"escalate" \| "close_blocked"/);
  assert.match(contract, /releaseAuthorized: false/);
  assert.match(contract, /secureContentReviewAvailable: false/);
  assert.match(contract, /containsRawStoryContent: false/);
  assert.doesNotMatch(contract, /"approve"|"reject"/);
  assert.match(operations, /z\.enum\(\["escalate", "close_blocked"\]\)/);
  assert.match(operations, /releaseAuthorized: false/);
  assert.match(operations, /secureContentReviewAvailable: false/);
});

test('moderation handoff uses hashes and reason codes instead of raw story text', () => {
  assert.match(contract, /contentSha256: string/);
  assert.match(contract, /userIdHash: string/);
  assert.match(contract, /reasonCodes: string\[\]/);
  assert.match(contract, /must be a SHA-256 hex digest/);
  assert.doesNotMatch(contract, /storyBody:|sourceText:|promptText:|rawContent:/);
});

test('Admin decision receipts require separation of duties and evidence authority', () => {
  assert.match(contract, /separationOfDutiesSatisfied: boolean/);
  assert.match(contract, /receiptId: string/);
  assert.match(contract, /auditEventId: string/);
  assert.match(contract, /policyVersion: string/);
  assert.match(contract, /cannot authorize release without a governed secure content-review channel/);
});
