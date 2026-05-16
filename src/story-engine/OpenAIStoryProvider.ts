import type { StoryRequest } from '../types/story';
import { buildStorySystemPrompt, buildStoryUserPrompt } from './prompts';
import { generateLocalDemoStory } from './LocalDemoStoryProvider';

export async function generateAIStory(request: StoryRequest): Promise<string> {
  if (typeof window !== 'undefined') {
    return generateLocalDemoStory(request);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return generateLocalDemoStory(request);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: buildStorySystemPrompt(request) },
        { role: 'user', content: buildStoryUserPrompt(request) }
      ]
    })
  });

  if (!response.ok) {
    return generateLocalDemoStory(request);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === 'string' && content.trim() ? content.trim() : generateLocalDemoStory(request);
}
