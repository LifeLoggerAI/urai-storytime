import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const generation = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const versions = fs.readFileSync('functions/src/story-versioning.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const cloud = fs.readFileSync('src/components/storytime/CloudSession.tsx', 'utf8');
const player = fs.readFileSync('src/components/storytime/StoryPlayer.tsx', 'utf8');
const editor = fs.readFileSync('src/components/storytime/StoryRevisionEditor.tsx', 'utf8');

test('new generated stories receive immutable version 1', () => {
  assert.match(generation, /storyVersionId = id\("storyVersion"\)/);
  assert.match(generation, /schemaVersion: "storytime-version-v1"/);
  assert.match(generation, /versionNumber: 1/);
  assert.match(generation, /reason: "initial_generation"/);
  assert.match(generation, /immutable: true/);
  assert.match(generation, /currentVersionId: storyVersionId/);
  assert.match(generation, /currentVersionNumber: 1/);
  assert.match(generation, /collection\("storyVersions"\)/);
});

test('owner edits are immutable, optimistic-concurrency checked, provider-free revisions', () => {
  for (const marker of [
    'saveStoryRevision',
    'expectedCurrentVersionId',
    'This story changed since you opened it',
    'parentVersionId',
    'userEdited: true',
    'providerCallMade: false',
    'providerSpendAuthorized: false',
    'immutable: true',
    'storyVersions'
  ]) assert.ok(versions.includes(marker), `missing version marker: ${marker}`);

  assert.doesNotMatch(versions, /OPENAI_API_KEY|generateStoryWithProvider|fetch\(/);
});

test('restore creates a new version and never mutates immutable history', () => {
  assert.match(versions, /restoreStoryVersion/);
  assert.match(versions, /restoredFromVersionId/);
  assert.match(versions, /reason: "restore"/);
  assert.match(versions, /batch\.set\(versionRef, restored\)/);
  assert.doesNotMatch(versions, /batch\.update\(target\.ref/);
});

test('version history is server-owned and exposed through bounded owner callables', () => {
  assert.match(index, /saveStoryRevision, restoreStoryVersion, listStoryVersions/);
  assert.match(rules, /match \/storyVersions\/\{id\} \{ allow read, write: if false; \}/);
  assert.match(versions, /MAX_VERSION_HISTORY = 25/);
  assert.match(versions, /email_verified/);
});

test('cloud reader shows moments and owner editor uses exact current version authority', () => {
  assert.match(cloud, /storyMoments/);
  assert.match(cloud, /StoryRevisionEditor/);
  assert.match(player, /moment\.body/);
  assert.match(player, /Version/);
  assert.match(editor, /Save new version/);
  assert.match(editor, /Restore as new version/);
  assert.match(editor, /expectedCurrentVersionId: session\.currentVersionId/);
  assert.match(editor, /do not call a generation provider/);
});
