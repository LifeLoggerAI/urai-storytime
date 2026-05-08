import { createStoryId } from '../../core/types.mjs';

export class LocalDemoStoryProvider {
  generate(request, { now = Date.now() } = {}) {
    const id = createStoryId(now);
    const title = `${request.childName}'s ${request.theme} Adventure`;
    const body = `Tonight, ${request.childName} and a ${request.mood} firefly explored ${request.theme}. Guided by ${request.narrator}, they learned kindness, courage, and wonder.`;

    return {
      id,
      title,
      body,
      narrator: request.narrator,
      mood: request.mood,
      theme: request.theme,
      ageBand: request.ageBand,
      createdAt: new Date(now).toISOString(),
    };
  }
}
