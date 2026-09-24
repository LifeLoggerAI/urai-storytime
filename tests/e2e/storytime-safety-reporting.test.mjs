import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn = fs.readFileSync('functions/src/safety-reports.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const moderation = fs.readFileSync('functions/src/moderation-operations.ts', 'utf8');
const privacy = fs.readFileSync('functions/src/privacy-execution.ts', 'utf8');
const controls = fs.readFileSync('src/components/storytime/SafetyReportControls.tsx', 'utf8');
const cloud = fs.readFileSync('src/components/storytime/CloudSession.tsx', 'utf8');

test('safety reports are owner-scoped, idempotent, category-only, and server-owned', () => {
  assert.match(fn, /reportStorytimeSafetyConcern/);
  assert.match(fn, /sessionSnapshot\.data\(\)\?\.userId !== userId/);
  assert.match(fn, /requestId: z\.string\(\)\.min\(8\)/);
  assert.match(fn, /category: z\.enum/);
  assert.match(fn, /confirmation: z\.literal\(true\)/);
  assert.match(fn, /containsRawStoryContent: false/);
  assert.match(fn, /transaction\.create\(reportRef/);
  assert.match(index, /safety-reports\.js/);
  assert.match(rules, /match \/storySafetyReports\/\{reportId\}/);
  assert.match(rules, /allow create, update, delete: if false/);
  assert.match(fn, /MAX_SAFETY_REPORTS_PER_DAY/);
  assert.match(fn, /storytimeSafetyReportCounters/);
  assert.match(fn, /resource-exhausted/);
  assert.match(rules, /match \/storytimeSafetyReportCounters\/\{id\} \{ allow read, write: if false; \}/);
  assert.doesNotMatch(fn, /note:|details:|storyText:|sourceText:/);
});

test('safety reports enter the sanitized moderation queue without release authority', () => {
  assert.match(fn, /stage: "user_report"/);
  assert.match(fn, /fingerprintKind: "target_reference"/);
  assert.match(fn, /user_report:/);
  assert.match(moderation, /data\.stage === "user_report"/);
  assert.match(moderation, /releaseAuthorized: false/);
});

test('user-facing reporting is explicit about privacy and lack of emergency monitoring', () => {
  assert.match(controls, /without copying the story body into the moderation queue/);
  assert.match(controls, /not emergency monitoring or clinical support/);
  assert.match(controls, /category-only safety report/);
  assert.match(controls, /role=\{error \? "alert" : "status"\}/);
  assert.doesNotMatch(controls, /textarea/);
  assert.match(cloud, /SafetyReportControls/);
});

test('Storytime data-rights inventory includes safety reports', () => {
  const matches = privacy.match(/"storySafetyReports"/g) || [];
  assert.ok(matches.length >= 2, 'safety reports must be present in account and session inventories');
});
