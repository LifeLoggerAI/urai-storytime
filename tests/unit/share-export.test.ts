import { describe, expect, it } from 'vitest';
import { createShareCardText, createStoryExport } from '../../src/lib/shareExport';
import type { Story } from '../../src/types/story';

const story: Story = {
  id: 'story_test',
  familyId: 'family_test',
  childProfileId: 'child_test',
  storyRunId: 'run_test',
  title: 'Call 555-123-4567 for the Moon Garden',
  summary: 'Email parent@example.com or visit https://example.com/private.',
  body: 'A gentle story with www.example.org in the notes.',
  scenes: [
    {
      id: 'scene_test',
      storyId: 'story_test',
      familyId: 'family_test',
      index: 0,
      title: 'Scene with parent@example.com',
      text: 'Phone: (555) 222-3333',
      emotion: 'gentle',
      motif: 'moon',
      visualPrompt: 'Reference https://example.com/image.png',
      captionStartMs: 0,
      captionEndMs: 1000
    }
  ],
  narratorId: 'gentle_firefly',
  mood: 'gentle',
  theme: 'Moon Garden',
  safetyReviewId: 'safety_test',
  status: 'ready',
  visibility: 'private',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('shareExport', () => {
  it('redacts sensitive details from exported story fields', () => {
    const exported = createStoryExport(story);
    const serialized = JSON.stringify(exported);

    expect(serialized).not.toContain('parent@example.com');
    expect(serialized).not.toContain('555-123-4567');
    expect(serialized).not.toContain('https://example.com');
    expect(serialized).toContain('[redacted email]');
    expect(serialized).toContain('[redacted phone]');
    expect(serialized).toContain('[redacted link]');
  });

  it('redacts and bounds share card text', () => {
    const text = createShareCardText({
      ...story,
      summary: `${story.summary} ${'calm '.repeat(300)}`
    });

    expect(text).not.toContain('parent@example.com');
    expect(text).not.toContain('https://example.com');
    expect(text.length).toBeLessThanOrEqual(800);
  });
});
