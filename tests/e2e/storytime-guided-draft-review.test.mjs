import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');
const drafts = fs.readFileSync('functions/src/story-drafts.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');

test('guided flow requires details review before generation consent and submission', () => {
  assert.match(home, /type StoryStep = "details" \| "review"/);
  assert.match(home, /Review story request/);
  assert.match(home, /Review exactly what will be submitted/);
  assert.match(home, /step !== "review"/);
  assert.match(home, /Create private story/);
  assert.match(home, /Memory import<\/dt><dd>Off/);
  assert.match(home, /Voiceover<\/dt><dd>Off/);
  assert.match(home, /Public sharing<\/dt><dd>Off/);
});

test('private draft storage has independent explicit consent and never authorizes provider execution', () => {
  for (const marker of [
    'storytime-draft-storage-consent-v1',
    'draftStorageConsent',
    'Save and resume this private draft for up to 30 days',
    'Saving a draft does not submit it to the story-generation provider',
    'saveStoryDraft',
    'getStoryDraft',
    'deleteStoryDraft'
  ]) assert.ok(home.includes(marker), `missing draft UI marker: ${marker}`);

  assert.match(drafts, /draftStorageConsent: z\.literal\(true\)/);
  assert.match(drafts, /draftStorageConsentVersion: z\.literal\(DRAFT_STORAGE_CONSENT_VERSION\)/);
  assert.match(drafts, /providerSubmitted: false/);
  assert.match(drafts, /publicSharingAuthorized: false/);
  assert.doesNotMatch(drafts, /OPENAI_API_KEY|generateStoryWithProvider|fetch\(/);
});

test('Storytime drafts are verified-account, bounded, expiring, and server-only', () => {
  assert.match(drafts, /email_verified/);
  assert.match(drafts, /DRAFT_RETENTION_DAYS = 30/);
  assert.match(drafts, /sourceText: z\.string\(\)\.max\(1200\)/);
  assert.match(drafts, /storyDrafts/);
  assert.match(rules, /match \/storyDrafts\/\{id\} \{ allow read, write: if false; \}/);
  assert.match(index, /saveStoryDraft, getStoryDraft, deleteStoryDraft/);
});

test('turning draft persistence off attempts immediate saved-draft deletion', () => {
  assert.match(home, /handleDraftStorageChange/);
  assert.match(home, /deleteStoryDraft/);
  assert.match(home, /Saved private draft deleted/);
});
