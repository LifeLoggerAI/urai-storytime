import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const drafts = fs.readFileSync('functions/src/story-drafts.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const indexes = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));
const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');
const library = fs.readFileSync('src/components/storytime/DraftLibrary.tsx', 'utf8');

test('private draft persistence requires verified ownership and explicit storage consent', () => {
  for (const marker of [
    'DRAFT_STORAGE_CONSENT_VERSION = "story-draft-storage-v1"',
    'privateDraftStorage: z.literal(true)',
    'requireVerifiedOwner',
    'expectedRevision',
    'currentRevision !== input.expectedRevision',
    'generationConsentStored: false',
    'providerProcessingAuthorized: false',
    'storytime_private_draft'
  ]) assert.ok(drafts.includes(marker), `missing draft safety marker: ${marker}`);

  assert.doesNotMatch(drafts, /generateStoryWithProvider|OPENAI_API_KEY|STORYTIME_GENERATION_PROVIDER/);
  assert.match(index, /saveStoryDraft, deleteStoryDraft/);
});

test('drafts are owner-readable but client writes are forbidden', () => {
  assert.match(rules, /match \/storyDrafts\/\{id\}/);
  const start = rules.indexOf('match /storyDrafts/{id}');
  const end = rules.indexOf('match /storyVersions/{id}', start);
  const block = rules.slice(start, end);
  assert.match(block, /allow read: if ownerOnlyReadWrite\(resource\.data\.userId\)/);
  assert.match(block, /allow create, update, delete: if false/);

  const draftIndex = indexes.indexes.find((item) => item.collectionGroup === 'storyDrafts');
  assert.ok(draftIndex, 'storyDrafts owner/updatedAt index must exist');
  assert.deepEqual(draftIndex.fields.map((field) => field.fieldPath), ['userId', 'updatedAt']);
});

test('draft library is owner-scoped and does not display stored source text', () => {
  assert.match(library, /where\("userId", "==", user\.uid\)/);
  assert.match(library, /orderBy\("updatedAt", "desc"\)/);
  assert.match(library, /Resume draft/);
  assert.doesNotMatch(library, /draft\.sourceText/);
});

test('autosave is opt-in and resume restores no generation/provider consent or request review', () => {
  for (const marker of [
    'draftStorageConsent',
    'Save this form as a private Storytime draft while I work',
    'Draft storage is separate from story-generation and provider consent',
    'saveStoryDraft',
    'expectedRevision',
    'setAdultGuardianAffirmed(false)',
    'setGenerationConsent(false)',
    'setProviderProcessingConsent(false)',
    'setReviewedFingerprint(null)',
    'Private draft resumed. Generation and provider consent were not restored.'
  ]) assert.ok(home.includes(marker), `missing autosave/resume marker: ${marker}`);

  assert.match(home, /disabled=\{!cloudReady \|\| Boolean\(validationError\) \|\| isSubmitting \|\| draftSaving\}/);
  assert.match(home, /deleteStoryDraft/);
});
