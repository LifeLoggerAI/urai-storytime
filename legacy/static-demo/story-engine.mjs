const blocked = [
  'violence',
  'blood',
  'weapon',
  'abuse',
  'hate',
  'kill',
  'suicide',
  'self-harm',
  'sex',
  'nude',
  'drugs',
  'alcohol'
];

const clamp = (value = '', max = 80) => String(value).trim().slice(0, max);

export function moderatePrompt(input = '') {
  const text = String(input).toLowerCase();
  const hits = blocked.filter((word) => text.includes(word));
  return { safe: hits.length === 0, hits };
}

export function generateStory({ childName, theme, mood, narrator, prompt = '' }) {
  const fields = {
    childName: clamp(childName, 32),
    theme: clamp(theme, 60),
    mood: clamp(mood, 24),
    narrator: clamp(narrator, 40),
    prompt: clamp(prompt, 500)
  };

  if (!fields.childName || !fields.theme) {
    throw new Error('Please provide a child display name and story theme.');
  }

  const safe = moderatePrompt(Object.values(fields).join(' '));
  if (!safe.safe) throw new Error(`Please remove unsafe words: ${safe.hits.join(', ')}`);

  const id = `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const title = `${fields.childName}'s ${fields.theme} Adventure`;
  const promptThread = fields.prompt ? ` Along the way, the story remembered this wish: ${fields.prompt}.` : '';
  const body = `Tonight, ${fields.childName} and a ${fields.mood} firefly explored ${fields.theme}. Guided by ${fields.narrator}, they followed soft moonlight, helped a shy star find its sparkle, and learned kindness, courage, and wonder.${promptThread} When the adventure ended, ${fields.childName} felt safe, loved, and ready to rest.`;

  return {
    id,
    title,
    summary: `${fields.mood} bedtime story about ${fields.theme}`,
    body,
    narrator: fields.narrator,
    mood: fields.mood,
    theme: fields.theme,
    safetyMode: 'local-demo-precheck',
    provider: 'local-demo-template',
    createdAt: new Date().toISOString()
  };
}
