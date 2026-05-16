import type { SafetyReview } from '../types/safety';
import type { Story, StoryRequest, StoryRun } from '../types/story';
import { LocalSafetyProvider } from '../safety/LocalSafetyProvider';
import { generateAIStory } from './OpenAIStoryProvider';
import { splitIntoScenes } from './SceneSplitter';

const safety = new LocalSafetyProvider();

function now() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getProviderName(): StoryRun['provider'] {
  if (typeof window !== 'undefined') return 'local_demo';
  return process.env.OPENAI_API_KEY ? 'openai' : 'local_demo';
}

export async function createStoryManifest(request: StoryRequest): Promise<{
  story: Story;
  run: StoryRun;
  precheck: SafetyReview;
  postcheck: SafetyReview;
}> {
  const pre = safety.check(`${request.childDisplayName} ${request.theme} ${request.mood} ${request.prompt}`);
  const runId = makeId('run');
  const storyId = makeId('story');

  const precheck: SafetyReview = {
    id: makeId('safety_pre'),
    familyId: request.familyId,
    targetType: 'prompt',
    targetId: request.id,
    ageBand: request.ageBand,
    classification: pre.classification,
    blockedReasons: pre.blockedReasons,
    reviewStatus: pre.safe ? 'auto_approved' : pre.reviewRequired ? 'pending_human' : 'auto_blocked',
    createdAt: now()
  };

  if (!pre.safe) {
    return {
      story: {
        id: storyId,
        familyId: request.familyId,
        childProfileId: request.childProfileId,
        storyRunId: runId,
        title: 'Story needs a softer version',
        summary: pre.parentMessage,
        body: '',
        scenes: [],
        narratorId: request.narratorId,
        mood: request.mood,
        theme: request.theme,
        safetyReviewId: precheck.id,
        status: 'blocked',
        visibility: 'private',
        createdAt: now(),
        updatedAt: now()
      },
      run: {
        id: runId,
        requestId: request.id,
        familyId: request.familyId,
        provider: 'local_demo',
        status: 'blocked',
        safetyPrecheckId: precheck.id,
        createdAt: now(),
        completedAt: now()
      },
      precheck,
      postcheck: precheck
    };
  }

  const body = await generateAIStory(request);
  const post = safety.check(body);
  const postcheck: SafetyReview = {
    id: makeId('safety_post'),
    familyId: request.familyId,
    targetType: 'story',
    targetId: storyId,
    ageBand: request.ageBand,
    classification: post.classification,
    blockedReasons: post.blockedReasons,
    reviewStatus: post.safe ? 'auto_approved' : post.reviewRequired ? 'pending_human' : 'auto_blocked',
    createdAt: now()
  };

  const scenes = post.safe
    ? splitIntoScenes({ storyId, familyId: request.familyId, body, mood: request.mood, theme: request.theme })
    : [];

  const story: Story = {
    id: storyId,
    familyId: request.familyId,
    childProfileId: request.childProfileId,
    storyRunId: runId,
    title: post.safe ? `${request.childDisplayName}'s ${request.theme} Story` : 'Story needs review',
    summary: post.safe ? `${request.mood} story about ${request.theme}` : post.parentMessage,
    body: post.safe ? body : '',
    scenes,
    narratorId: request.narratorId,
    mood: request.mood,
    theme: request.theme,
    safetyReviewId: postcheck.id,
    status: post.safe ? 'ready' : 'blocked',
    visibility: 'private',
    createdAt: now(),
    updatedAt: now()
  };

  const run: StoryRun = {
    id: runId,
    requestId: request.id,
    familyId: request.familyId,
    provider: getProviderName(),
    status: post.safe ? 'complete' : 'blocked',
    safetyPrecheckId: precheck.id,
    safetyPostcheckId: postcheck.id,
    createdAt: now(),
    completedAt: now()
  };

  return { story, run, precheck, postcheck };
}
