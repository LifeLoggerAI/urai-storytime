import type { StoryMood, StoryScene } from '../types/story';

export function splitIntoScenes(params: {
  storyId: string;
  familyId: string;
  body: string;
  mood: StoryMood;
  theme: string;
}): StoryScene[] {
  const sentences = params.body
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const sceneCount = Math.min(5, Math.max(3, Math.ceil(sentences.length / 3)));
  const chunkSize = Math.ceil(sentences.length / sceneCount);

  return Array.from({ length: sceneCount }).map((_, index) => {
    const text = sentences.slice(index * chunkSize, (index + 1) * chunkSize).join(' ');
    const startMs = index * 45000;
    const endMs = startMs + Math.max(25000, text.length * 70);

    return {
      id: `${params.storyId}_scene_${index + 1}`,
      storyId: params.storyId,
      familyId: params.familyId,
      index,
      title: `Scene ${index + 1}`,
      text,
      emotion: params.mood,
      motif: index === 0 ? 'moonlit doorway' : index === sceneCount - 1 ? 'soft homecoming' : 'glowing companion',
      visualPrompt: `A calm magical children's storybook illustration of ${params.theme}, ${params.mood} mood, soft cinematic lighting, safe bedtime tone, no frightening imagery.`,
      captionStartMs: startMs,
      captionEndMs: endMs
    };
  });
}
