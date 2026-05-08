export function splitStoryIntoScenes(story) {
  const sentences = String(story?.body || '')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const sceneTexts = sentences.length ? sentences : [story?.body || ''];

  return sceneTexts.map((text, index) => ({
    id: `${story.id}_scene_${index + 1}`,
    index,
    title: index === 0 ? story.title : `Scene ${index + 1}`,
    text,
    mood: story.mood,
    narrator: story.narrator,
  }));
}
