import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryManifest } from '../../src/story-engine/StoryEngine.ts';

test('createStoryManifest returns a story manifest', async () => {
    const storyRequest = {
        id: 'test-request',
        familyId: 'test-family',
        childProfileId: 'test-child',
        requestedByUserId: 'test-user',
        childDisplayName: 'Ari',
        ageBand: 'preschool_3_5',
        theme: 'Friendship',
        mood: 'gentle',
        narratorId: 'test-narrator',
        prompt: 'A story about friendship',
        memorySeedIds: [],
        bedtimeMode: false,
        createdAt: new Date().toISOString(),
    };

    const { story, run, precheck, postcheck } = await createStoryManifest(storyRequest);

    assert.ok(story.id);
    assert.ok(story.title.includes('Ari'));
    assert.equal(story.status, 'ready');
    assert.equal(run.status, 'complete');
    assert.equal(precheck.reviewStatus, 'auto_approved');
    assert.equal(postcheck.reviewStatus, 'auto_approved');
});
