import type { Story } from '../types/story';

const KEY = 'urai_storytime_local_stories';
const MAX_LOCAL_STORIES = 50;

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function writeLocalStories(stories: Story[]) {
  if (!hasBrowserStorage()) return false;

  try {
    localStorage.setItem(KEY, JSON.stringify(stories.slice(0, MAX_LOCAL_STORIES)));
    return true;
  } catch {
    return false;
  }
}

export function listLocalStories(): Story[] {
  if (!hasBrowserStorage()) return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as Story[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalStory(story: Story) {
  const existing = listLocalStories().filter((existingStory) => existingStory.id !== story.id);
  return writeLocalStories([story, ...existing]);
}

export function getLocalStory(storyId: string): Story | null {
  return listLocalStories().find((story) => story.id === storyId) || null;
}

export function deleteLocalStory(storyId: string) {
  return writeLocalStories(listLocalStories().filter((story) => story.id !== storyId));
}