import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const packageJson = JSON.parse(read('package.json'));
const storytimeHome = read('src/components/storytime/StorytimeHome.tsx');
const storytimeSessionRoute = read('src/app/storytime/[sessionId]/page.tsx');
const shareRoute = read('src/app/share/story/[shareId]/page.tsx');
const rules = read('firestore.rules');
const indexes = read('firestore.indexes.json');
const firebaseConfig = read('firebase.json');
const functions = read('functions/src/storytime.ts');
const deploymentDoc = read('docs/STORYTIME_DEPLOYMENT.md');
const qaDoc = read('docs/STORYTIME_QA_CHECKLIST.md');

test('Next and Firebase scripts are present', () => {
  assert.equal(packageJson.scripts.build, 'next build');
  assert.equal(packageJson.scripts.typecheck, 'tsc --noEmit');
  assert.match(packageJson.scripts['deploy:rules'], /firestore:rules/);
  assert.match(packageJson.dependencies.next, /^\^15/);
  assert.match(packageJson.dependencies.firebase, /^\^11/);
});

test('Storytime app routes are wired', () => {
  assert.match(storytimeHome, /URAI Narrative Engine/);
  assert.match(storytimeHome, /Private by default/);
  assert.match(storytimeSessionRoute, /StoryPlayer/);
  assert.match(storytimeSessionRoute, /ChapterTimeline/);
  assert.match(storytimeSessionRoute, /EmotionalArcViewer/);
  assert.match(shareRoute, /Public-safe share/);
  assert.match(shareRoute, /redacted/);
});

test('Firestore rules enforce owner and public-share boundaries', () => {
  assert.match(rules, /function isOwner/);
  assert.match(rules, /match \/storySessions\/{id}/);
  assert.match(rules, /match \/publicStoryShares\/{id}/);
  assert.match(rules, /revoked == false/);
  assert.match(rules, /allow update, delete: if false/);
});

test('Firestore indexes include core Storytime queries', () => {
  const parsed = JSON.parse(indexes);
  const collectionGroups = parsed.indexes.map((index) => index.collectionGroup);
  assert.ok(collectionGroups.includes('storySessions'));
  assert.ok(collectionGroups.includes('storyChapters'));
  assert.ok(collectionGroups.includes('storyMoments'));
  assert.ok(collectionGroups.includes('publicStoryShares'));
});

test('Firebase hosting and functions config are present', () => {
  assert.match(firebaseConfig, /frameworksBackend/);
  assert.match(firebaseConfig, /storytime/);
  assert.match(firebaseConfig, /firestore\.rules/);
});

test('Callable functions cover Storytime lifecycle hooks', () => {
  for (const name of [
    'generateStorySession',
    'createPublicStoryShare',
    'generateNarratorScript',
    'generateEmotionalArcSummary',
    'generateWeeklyStoryScroll',
    'prepareVoiceoverJob',
    'refreshStoryTimeline',
    'rebuildUserStoryArchive'
  ]) {
    assert.match(functions, new RegExp(`export const ${name}`));
  }
  assert.match(functions, /Story generation consent is required/);
  assert.match(functions, /Public sharing requires explicit consent/);
});

test('Deployment and QA docs preserve launch boundaries', () => {
  assert.match(deploymentDoc, /Known launch boundary/);
  assert.match(deploymentDoc, /firebase deploy --only firestore:rules,firestore:indexes/);
  assert.match(qaDoc, /Story sessions default to `visibility: private`/);
  assert.match(qaDoc, /avoids diagnosis|no diagnosis/i);
});
