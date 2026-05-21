import type { Story, StoryScene } from '../types/story';

export type StoryExport = {
  version: 'urai-storytime-export-v1';
  exportedAt: string;
  story: Pick<Story, 'id' | 'title' | 'summary' | 'body' | 'scenes' | 'mood' | 'theme' | 'createdAt'>;
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;
const URL_PATTERN = /https?:\/\/\S+|www\.\S+/gi;
const MAX_SHARE_TEXT_CHARS = 800;

function redactShareText(value: string) {
  return value
    .replace(EMAIL_PATTERN, '[redacted email]')
    .replace(PHONE_PATTERN, '[redacted phone]')
    .replace(URL_PATTERN, '[redacted link]')
    .trim();
}

function redactScene(scene: StoryScene): StoryScene {
  return {
    ...scene,
    title: redactShareText(scene.title),
    text: redactShareText(scene.text),
    visualPrompt: redactShareText(scene.visualPrompt)
  };
}

export function createStoryExport(story: Story): StoryExport {
  return {
    version: 'urai-storytime-export-v1',
    exportedAt: new Date().toISOString(),
    story: {
      id: story.id,
      title: redactShareText(story.title),
      summary: redactShareText(story.summary),
      body: redactShareText(story.body),
      scenes: story.scenes.map(redactScene),
      mood: story.mood,
      theme: redactShareText(story.theme),
      createdAt: story.createdAt
    }
  };
}

export function createShareCardText(story: Story): string {
  return redactShareText(
    `${story.title}\n\n${story.summary}\n\nCreated with URAI Storytime — a gentle, family-safe storytelling experience.`
  ).slice(0, MAX_SHARE_TEXT_CHARS);
}