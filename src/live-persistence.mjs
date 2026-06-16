import { createFirebaseRuntime } from './firebase-adapter.mjs';

export function createLivePersistence(config = {}) {
  const runtime = createFirebaseRuntime(config);

  return {
    runtime,
    enabled: false,
    blocker: 'Live Firestore persistence is blocked until Firebase/Auth/rules are verified.',

    async saveStory() {
      throw new Error('Live persistence is not enabled.');
    },

    async loadStories() {
      throw new Error('Live persistence is not enabled.');
    },

    async deleteStory() {
      throw new Error('Live persistence is not enabled.');
    },
  };
}
