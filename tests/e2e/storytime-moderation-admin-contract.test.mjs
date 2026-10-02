import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ops = fs.readFileSync('functions/src/moderation-operations.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');

test('moderation operations require trusted admin authority and return sanitized cases', () => {
  assert.match(ops, /admin !== true/);
  assert.match(ops, /role !== "admin"/);
  assert.match(ops, /listStorytimeModerationCases/);
  assert.match(ops, /getStorytimeModerationCase/);
  assert.match(ops, /contentSha256/);
  assert.match(ops, /containsRawStoryContent/);
  assert.doesNotMatch(ops, /sourceText|momentBody|narratorText/);
});

test('moderation transitions cannot approve or release flagged content', () => {
  assert.match(ops, /action: z\.enum\(\["escalate", "close_blocked"\]\)/);
  assert.match(ops, /nextStatus = input\.action === "escalate" \? "escalated" : "resolved_blocked"/);
  assert.match(ops, /releaseAuthorized: false/);
  assert.match(ops, /secureContentReviewAvailable: false/);
  assert.doesNotMatch(ops, /"approve"|"release"/);
});

test('moderation queue rejects raw-content cases and records server-side immutable audit receipts', () => {
  assert.match(ops, /Raw story content is not allowed in the Storytime moderation queue/);
  assert.match(ops, /storytime-moderation-audit-v1/);
  assert.match(ops, /transaction\.create\(auditRef/);
  assert.match(ops, /actorUid/);
  assert.match(ops, /contentSha256: data\.contentSha256/);
  assert.match(index, /moderation-operations\.js/);
  assert.match(rules, /match \/moderation\/\{moderationId\} \{[\s\S]*allow read: if isAdmin\(\);[\s\S]*allow write: if false;/);
  assert.match(rules, /match \/moderationAuditLogs\/\{id\} \{[\s\S]*allow read: if isAdmin\(\);[\s\S]*allow create, update, delete: if false;/);
});
