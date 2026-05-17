// URAI Storytime persistence boundary
//
// The current application stores stories locally for demo purposes.
// This module creates an explicit boundary so Firebase-backed persistence
// can be introduced without spreading storage logic across UI code.

export const PERSISTENCE_MODES = Object.freeze({
  localDemo: 'local-demo',
  firebase: 'firebase',
});

export const LOCAL_LIBRARY_KEY = 'urai_library';

export function createStoryRecord(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Story input is required.');
  }

  const now = new Date().toISOString();

  return {
    id: input.id || `story-${Date.now()}`,
    title: input.title || 'Untitled Story',
    prompt: input.prompt || '',
    story: input.story || '',
    childProfileId: input.childProfileId || null,
    familyId: input.familyId || null,
    moderationDecision: input.moderationDecision || 'unknown',
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    persistenceMode: input.persistenceMode || PERSISTENCE_MODES.localDemo,
  };
}

export function readLocalStories(storage = globalThis.localStorage) {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(LOCAL_LIBRARY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalStories(stories, storage = globalThis.localStorage) {
  if (!storage) {
    throw new Error('Local storage is unavailable.');
  }

  if (!Array.isArray(stories)) {
    throw new Error('Stories must be an array.');
  }

  storage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(stories));
  return stories;
}

export function addLocalStory(storyInput, storage = globalThis.localStorage) {
  const stories = readLocalStories(storage);
  const story = createStoryRecord(storyInput);
  const updatedStories = [story, ...stories];
  writeLocalStories(updatedStories, storage);
  return story;
}

export function assertCloudPersistenceReady({ firebaseReady = false, authReady = false, rulesReady = false } = {}) {
  const missing = [];

  if (!firebaseReady) missing.push('firebaseReady');
  if (!authReady) missing.push('authReady');
  if (!rulesReady) missing.push('rulesReady');

  if (missing.length > 0) {
    throw new Error(`Cloud persistence is not ready. Missing: ${missing.join(', ')}`);
  }

  return true;
}
