import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shareStory = fs.readFileSync('src/components/storytime/ShareStory.tsx', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const indexes = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));
const lifecycle = fs.readFileSync('functions/src/public-story-share-lifecycle.ts', 'utf8');
const functionsIndex = fs.readFileSync('functions/src/index.ts', 'utf8');

test('public share page uses a direct slug-addressed document read', () => {
  assert.match(shareStory, /getDoc\(doc\(db, "publicStoryShares", shareId\)\)/);
  assert.doesNotMatch(shareStory, /collection\(|getDocs\(|where\(/);
  assert.match(shareStory, /data\.slug !== id/);
  assert.match(shareStory, /"userId" in data \|\| "sessionId" in data/);
  assert.match(shareStory, /Date\.parse\(expiresAt\) <= Date\.now\(\)/);

  const publicShareIndex = indexes.indexes.find(
    (index) => index.collectionGroup === 'publicStoryShares'
  );
  assert.equal(publicShareIndex, undefined, 'slug-addressed reads must not depend on a public share query index');
});

test('Firestore enforces server-time expiration and public-safe fields', () => {
  assert.match(rules, /function activePublicShare\(\)/);
  assert.match(rules, /resource\.data\.schemaVersion == 'public-story-share-v2'/);
  assert.match(rules, /!resource\.data\.keys\(\)\.hasAny\(\['userId', 'sessionId'\]\)/);
  assert.match(rules, /request\.time < resource\.data\.expiresAt/);
  assert.match(rules, /match \/publicStoryShares\/\{id\}/);
  assert.match(rules, /allow read: if activePublicShare\(\)/);
  assert.match(rules, /allow create, update, delete: if false/);
  assert.match(rules, /match \/publicStoryShareControls\/\{id\}/);
});

test('callable lifecycle splits public derivatives from private owner controls', () => {
  assert.match(functionsIndex, /createPublicStoryShare, revokePublicStoryShare/);
  assert.match(functionsIndex, /public-story-share-lifecycle\.js/);
  assert.doesNotMatch(functionsIndex, /createPublicStoryShare[\s\S]*from "\.\/storytime\.js"/);
  assert.match(lifecycle, /schemaVersion: "public-story-share-v2"/);
  assert.match(lifecycle, /collection\("publicStoryShareControls"\)/);
  assert.match(lifecycle, /expiresAt: Timestamp\.fromMillis/);
  assert.match(lifecycle, /consentSnapshot\?\.publicSharing !== true/);
  assert.match(lifecycle, /session\.safetyStatus !== "approved"/);
  assert.match(lifecycle, /FieldValue\.delete\(\)/);
  assert.doesNotMatch(lifecycle.match(/transaction\.create\(newShareRef,[\s\S]*?\n    \}\);/)?.[0] ?? '', /userId|sessionId/);
});
