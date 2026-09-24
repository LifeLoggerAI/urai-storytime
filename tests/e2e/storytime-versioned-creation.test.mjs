import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const functions = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const version = fs.readFileSync('functions/src/story-version.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');
const cloud = fs.readFileSync('src/components/storytime/CloudSession.tsx', 'utf8');
const history = fs.readFileSync('src/components/storytime/StoryVersionHistory.tsx', 'utf8');
const indexes = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));

test('initial generation commits an immutable SHA-bound version in the same persistence batch', () => {
  for (const marker of [
    'buildInitialStoryVersionRecord',
    'versionId = id("storyVersion")',
    'currentVersionId: versionId',
    'versionNumber: 1',
    'db.collection("storyVersions").doc(versionId)'
  ]) assert.ok(functions.includes(marker), `missing version persistence marker: ${marker}`);

  for (const marker of [
    'story-version-v1',
    'versionNumber: 1',
    'parentVersionId: null',
    'reason: "initial_generation"',
    'immutable: true',
    'contentSha256: sha256(snapshot)',
    'reviewedRequestSha256: input.reviewedRequestSha256'
  ]) assert.ok(version.includes(marker), `missing immutable version marker: ${marker}`);
});

test('version history is owner-readable but cannot be mutated directly by clients', () => {
  assert.match(rules, /match \/storyVersions\/\{id\}/);
  const start = rules.indexOf('match /storyVersions/{id}');
  const end = rules.indexOf('match /publicStoryShares/{id}', start);
  const block = rules.slice(start, end);
  assert.match(block, /allow read: if ownerOnlyReadWrite\(resource\.data\.userId\)/);
  assert.match(block, /allow create, update, delete: if false/);
  assert.match(cloud, /collection\(db, "storyVersions"\)/);
  assert.match(cloud, /where\("userId", "==", userId\)/);
  assert.match(cloud, /StoryVersionHistory/);
  const versionIndex = indexes.indexes.find((item) => item.collectionGroup === 'storyVersions');
  assert.ok(versionIndex, 'storyVersions owner/session index must exist');
  assert.deepEqual(versionIndex.fields.map((field) => field.fieldPath), ['userId', 'sessionId']);
  assert.match(history, /Editing or regeneration must create a new/);
});

test('generation requires review of the exact request and changing fields invalidates that review', () => {
  for (const marker of [
    'STORY_REQUEST_REVIEW_VERSION = "story-request-review-v1"',
    'requestReviewFingerprint',
    'reviewedFingerprint === requestReviewFingerprint',
    'Review the exact Storytime request before generation',
    'reviewVersion: STORY_REQUEST_REVIEW_VERSION',
    'Changing any field after this confirmation automatically invalidates the review'
  ]) assert.ok(home.includes(marker), `missing request-review marker: ${marker}`);

  assert.match(functions, /reviewed: z\.literal\(true\)/);
  assert.match(functions, /reviewVersion: z\.literal\(STORY_REQUEST_REVIEW_VERSION\)/);
  assert.match(functions, /processedRequestSha256 = reviewedRequestSha256\(input\)/);
  assert.match(functions, /requestReview: \{/);
  assert.match(functions, /processedRequestSha256/);
});
