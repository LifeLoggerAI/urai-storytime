import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LOCAL_LIBRARY_KEY,
  PERSISTENCE_MODES,
  addLocalStory,
  assertCloudPersistenceReady,
  createStoryRecord,
  readLocalStories,
} from '../src/story-persistence.mjs';

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

test('story records are normalized', () => {
  const record = createStoryRecord({
    title: 'Moonlit Adventure',
    prompt: 'A calm space story',
  });

  assert.equal(record.title, 'Moonlit Adventure');
  assert.equal(record.persistenceMode, PERSISTENCE_MODES.localDemo);
  assert.ok(record.createdAt);
});

test('local stories are persisted', () => {
  const storage = createMemoryStorage();

  addLocalStory(
    {
      title: 'Orb Story',
      story: 'A glowing orb crossed the stars.',
    },
    storage,
  );

  const stories = readLocalStories(storage);

  assert.equal(stories.length, 1);
  assert.equal(stories[0].title, 'Orb Story');
  assert.ok(storage.getItem(LOCAL_LIBRARY_KEY));
});

test('cloud persistence readiness fails until firebase systems are verified', () => {
  assert.throws(() => {
    assertCloudPersistenceReady({
      firebaseReady: false,
      authReady: false,
      rulesReady: false,
    });
  }, /not ready/i);
});
