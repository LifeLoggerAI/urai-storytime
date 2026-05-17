import { describe, expect, it } from 'vitest';
import { createStoryManifest } from '../../src/story-engine/StoryEngine';
import type { StoryRequest } from '../../src/types/story';

const request: StoryRequest = {
  id: 'request_test',
  familyId: 'family_test',
  childProfileId: 'child_test',
  requestedByUserId: 'user_test',
  childDisplayName: 'Ari',
  ageBand: 'early_reader_6_8',
  theme: 'Moon Garden',
  mood: 'gentle',
  narratorId: 'gentle_firefly',
  prompt: 'A calm story about kindness.',
  memorySeedIds: [],
  bedtimeMode: true,
  createdAt: new Date().toISOString()
};

describe('StoryEngine', () => {
  it('creates a ready story for safe input', async () => {
    const result = await createStoryManifest(request);
    expect(result.story.status).toBe('ready');
    expect(result.story.scenes.length).toBeGreaterThan(0);
    expect(result.precheck.reviewStatus).toBe('auto_approved');
  });

  it('blocks unsafe input', async () => {
    const result = await createStoryManifest({
      ...request,
      prompt: 'A story about blood and weapons.'
    });
    expect(result.story.status).toBe('blocked');
    expect(result.precheck.blockedReasons.length).toBeGreaterThan(0);
  });
});
