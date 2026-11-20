import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  LEGACY_FAMILY_COLLECTIONS, LEGACY_FAMILY_CLOUD_ACCESS,
  STORYTIME_COLLECTIONS, createFirebaseRuntime,
  assertLegacyFamilyCloudAccessDenied,
} from '../../src/firebase-adapter.mjs';
import { createLivePersistence } from '../../src/live-persistence.mjs';
import { addLocalStory, readLocalStories } from '../../src/story-persistence.mjs';

const root = resolve(import.meta.dirname, '../..');
function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(path, e.name)) :
    /\.(?:[cm]?[jt]sx?)$/.test(e.name) ? [join(path, e.name)] : []
  );
}
test('historical names remain for migration but cloud access is explicitly denied', () => {
  assert.deepEqual(LEGACY_FAMILY_COLLECTIONS, ['stories', 'storyRuns']);
  assert.equal(STORYTIME_COLLECTIONS.stories, 'stories');
  assert.equal(STORYTIME_COLLECTIONS.storyRuns, 'storyRuns');
  assert.equal(LEGACY_FAMILY_CLOUD_ACCESS.status, 'denied');
  assert.equal(LEGACY_FAMILY_CLOUD_ACCESS.localDemoPreserved, true);
  assert.equal(createFirebaseRuntime().cloudSyncEnabled, false);
  assert.equal(createFirebaseRuntime().legacyFamilyCloudAccess.status, 'denied');
  for (const collection of LEGACY_FAMILY_COLLECTIONS) {
    assert.throws(() => assertLegacyFamilyCloudAccessDenied(collection), /disabled/i);
  }
  assert.equal(assertLegacyFamilyCloudAccessDenied('storySessions'), true);
});
test('legacy live-persistence shim remains hard-off even with complete-looking config', async () => {
  const live = createLivePersistence({
    apiKey:'synthetic',authDomain:'test.invalid',projectId:'demo-not-live',
    storageBucket:'test.invalid',messagingSenderId:'1',appId:'synthetic',
  });
  assert.equal(live.enabled,false);
  assert.equal(live.runtime.cloudSyncEnabled,false);
  assert.equal(live.runtime.legacyFamilyCloudAccess.status,'denied');
  await assert.rejects(live.saveStory({familyId:'family-a'}),/not enabled/i);
  await assert.rejects(live.loadStories(),/not enabled/i);
  await assert.rejects(live.deleteStory('legacy-id'),/not enabled/i);
});
test('local demo persists a synthetic story without new cloud authority', () => {
  const memory=new Map();
  const storage={
    getItem:key=>memory.get(key)??null,
    setItem:(key,value)=>memory.set(key,value),
  };
  const saved=addLocalStory({
    id:'synthetic-legacy-local-only',title:'Synthetic saved story',
    familyId:'synthetic-family',story:'No real family media',
  },storage);
  assert.equal(saved.persistenceMode,'local-demo');
  assert.equal(readLocalStories(storage)[0].id,saved.id);
  assert.equal(readLocalStories(storage)[0].familyId,'synthetic-family');
});
test('active Next.js UI and library contain no direct legacy family collection queries', () => {
  // The old reference-only firebase-adapter is intentionally excluded.
  const sources=[
    ...walk(join(root,'src/app')),
    ...walk(join(root,'src/components')),
    ...walk(join(root,'src/lib')),
  ];
  const patterns=[
    /\b(?:collection|doc|collectionGroup)\s*\(\s*[^)]*,\s*['"](?:stories|storyRuns)['"]/,
    /\b(?:collection|doc|collectionGroup)\s*\(\s*[^)]*,\s*['"]families\/[^'"]+\/(?:stories|storyRuns)\b/,
  ];
  for(const file of sources) {
    const body=readFileSync(file,'utf8');
    for (const pattern of patterns) {
      assert.doesNotMatch(body,pattern,'Direct legacy Firestore client query in '+file);
    }
  }
  assert.ok(sources.length>15);
});
