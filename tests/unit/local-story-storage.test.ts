import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Story } from '../../src/types/story';
import { deleteLocalStory, getLocalStory, listLocalStories, saveLocalStory } from '../../src/lib/localStoryStorage';

const story = (id: string): Story => ({
  id,
  familyId: 'family_test',
  childProfileId: 'child_test',
  storyRunId: 'run_test',
  title: `Story ${id}`,
  summary: 'A gentle test story.',
  body: 'Once upon a quiet test.',
  scenes: [],
  narratorId: 'gentle_firefly',
  mood: 'gentle',
  theme: 'Testing',
  safetyReviewId: 'safety_test',
  status: 'ready',
  visibility: 'private',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

function installStorageMock() {
  const store = new Map<string, string>();
  const storage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size;
    }
  } satisfies Storage;

  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', storage);
  return storage;
}

describe('localStoryStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an empty list without browser storage', () => {
    expect(listLocalStories()).toEqual([]);
    expect(getLocalStory('missing')).toBeNull();
  });

  it('saves, lists, gets, and deletes stories', () => {
    installStorageMock();

    expect(saveLocalStory(story('one'))).toBe(true);
    expect(saveLocalStory(story('two'))).toBe(true);
    expect(listLocalStories().map((savedStory) => savedStory.id)).toEqual(['two', 'one']);
    expect(getLocalStory('one')?.title).toBe('Story one');
    expect(deleteLocalStory('one')).toBe(true);
    expect(getLocalStory('one')).toBeNull();
  });

  it('fails safely when localStorage write throws', () => {
    const storage = installStorageMock();
    storage.setItem.mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(saveLocalStory(story('quota'))).toBe(false);
    expect(deleteLocalStory('quota')).toBe(false);
  });

  it('ignores malformed stored data', () => {
    const storage = installStorageMock();
    storage.getItem.mockReturnValue('{not json');

    expect(listLocalStories()).toEqual([]);
  });
});
