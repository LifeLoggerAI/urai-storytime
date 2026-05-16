import type { Story } from '../types/story';

const KEY = 'urai_storytime_local_stories';

export function listLocalStories(): Story[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Story[];
  } catch {
    return [];
  }
}

export function saveLocalStory(story: Story) {
  const existing = listLocalStories();
  localStorage.setItem(KEY, JSON.stringify([story, ...existing].slice(0, 50)));
}

export function getLocalStory(storyId: string): Story | null {
  return listLocalStories().find((story) => story.id === storyId) || null;
}

export function deleteLocalStory(storyId: string) {
  localStorage.setItem(
    KEY,
    JSON.stringify(listLocalStories().filter((story) => story.id !== storyId))
  );
}
