import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shareStory = fs.readFileSync('src/components/storytime/ShareStory.tsx', 'utf8');
const indexes = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));

test('public share query matches the Firestore non-revoked read boundary', () => {
  assert.match(shareStory, /where\("slug", "==", shareId\)/);
  assert.match(shareStory, /where\("revoked", "==", false\)/);

  const publicShareIndex = indexes.indexes.find(
    (index) => index.collectionGroup === 'publicStoryShares'
  );
  assert.ok(publicShareIndex, 'publicStoryShares index is required');
  assert.deepEqual(
    publicShareIndex.fields.map((field) => field.fieldPath),
    ['slug', 'revoked']
  );
});
