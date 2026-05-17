import type { StoryRequest } from '../types/story';

export function generateLocalDemoStory(request: StoryRequest): string {
  const child = request.childDisplayName || 'Ari';
  const theme = request.theme || 'Moon Garden';
  const guide = request.narratorId.replaceAll('_', ' ') || 'gentle firefly';

  return [
    `Tonight, ${child} stepped softly into the ${theme}, where every flower glowed like a tiny lantern.`,
    `A ${guide} appeared beside the path and whispered, “You are safe, and this adventure will be gentle.”`,
    `Together they followed silver stones across a quiet meadow, helping a shy star remember how to sparkle.`,
    `Whenever the wind became too loud, ${child} placed one hand over their heart and listened for the calm rhythm inside.`,
    `By the end of the journey, the garden had learned ${child}'s kindness, and ${child} had learned that courage can be soft.`,
    `The moon tucked the path away, the firefly dimmed its glow, and ${child} felt loved, safe, and ready to rest.`
  ].join(' ');
}
