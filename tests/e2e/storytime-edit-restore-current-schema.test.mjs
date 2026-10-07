import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const backend = fs.readFileSync('functions/src/story-versioning.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const audit = fs.readFileSync('functions/src/audit-log.ts', 'utf8');
const cloud = fs.readFileSync('src/components/storytime/CloudSession.tsx', 'utf8');
const editor = fs.readFileSync('src/components/storytime/StoryRevisionEditor.tsx', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');

test('owner revisions require exact current immutable version authority', () => {
  for (const marker of [
    'saveStoryRevision',
    'expectedCurrentVersionId',
    'This story changed since you opened it',
    'parentVersionId: authority.currentVersionId',
    'reason: "user_edit"',
    'immutable: true',
    'contentSha256: sha256(args.snapshot)'
  ]) assert.ok(backend.includes(marker), `missing revision marker: ${marker}`);
});

test('restore creates another immutable version and never mutates target history', () => {
  assert.match(backend, /restoreStoryVersion/);
  assert.match(backend, /reason: "restored_version"/);
  assert.match(backend, /restoredFromVersionId: input\.targetVersionId/);
  assert.match(backend, /transaction\.create\(versionRef, record\)/);
  assert.doesNotMatch(backend, /transaction\.update\(target\.ref/);
});

test('edit and restore are provider-free and audited', () => {
  assert.doesNotMatch(backend, /OPENAI_API_KEY|generateStoryWithProvider|STORYTIME_GENERATION_PROVIDER|api\.openai\.com/);
  assert.match(audit, /story_revision_saved/);
  assert.match(audit, /story_version_restored/);
  assert.match(index, /saveStoryRevision, restoreStoryVersion, listStoryVersions/);
});

test('client uses owner session state, polite status, and no silent migration', () => {
  assert.match(cloud, /storyMoments/);
  assert.match(cloud, /StoryRevisionEditor/);
  assert.match(editor, /Save new version/);
  assert.match(editor, /Restore as new version/);
  assert.match(editor, /aria-live="polite"/);
  assert.match(editor, /does not have the complete immutable Storytime version baseline/);
  assert.match(editor, /do not call a generation provider/);
});

test('version documents remain client immutable', () => {
  const start = rules.indexOf('match /storyVersions/{id}');
  assert.ok(start >= 0);
  const block = rules.slice(start, rules.indexOf('match /privacyDeletionPlans/{planId}', start));
  assert.match(block, /allow read: if ownerOnlyReadWrite\(resource\.data\.userId\)/);
  assert.match(block, /allow create, update, delete: if false/);
});

