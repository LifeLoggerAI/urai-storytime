import type { Story } from '../types/story';

export type StoryExport = {
  version: 'urai-storytime-export-v1';
  exportedAt: string;
  story: Pick<Story, 'id' | 'title' | 'summary' | 'body' | 'scenes' | 'mood' | 'theme' | 'createdAt'>;
};

export function createStoryExport(story: Story): StoryExport {
  return {
    version: 'urai-storytime-export-v1',
    exportedAt: new Date().toISOString(),
    story: {
      id: story.id,
      title: story.title,
      summary: story.summary,
      body: story.body,
      scenes: story.scenes,
      mood: story.mood,
      theme: story.theme,
      createdAt: story.createdAt
    }
  };
}

export function createShareCardText(story: Story): string {
  return `${story.title}\n\n${story.summary}\n\nCreated with URAI Storytime — a gentle, family-safe storytelling experience.`;
}
