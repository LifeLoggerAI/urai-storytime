'use client';

import { useMemo, useState } from 'react';
import type { Story } from '../types/story';
import { createShareCardText, createStoryExport } from '../lib/shareExport';
import { trackEvent } from '../lib/analytics';

export function StoryReplay({ story }: { story: Story }) {
  const [activeScene, setActiveScene] = useState(0);
  const [status, setStatus] = useState('');
  const scene = story.scenes[activeScene];
  const exportData = useMemo(() => createStoryExport(story), [story]);

  async function speak() {
    if (!('speechSynthesis' in window)) {
      setStatus('Narration is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const text = scene?.text || story.body;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    setStatus('Playing narration.');
    await trackEvent('story_replay_started', { storyId: story.id, scene: activeScene });
  }

  async function copyShareCard() {
    await navigator.clipboard.writeText(createShareCardText(story));
    setStatus('Share card text copied.');
    await trackEvent('story_export_created', { storyId: story.id, type: 'share_text' });
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${story.id}.json`;
    a.click();
    URL.revokeObjectURL(href);
    setStatus('Story export downloaded.');
  }

  return (
    <article className="card replay">
      <h1>{story.title}</h1>
      <p>{story.summary}</p>

      {scene ? (
        <section className="scene">
          <p className="eyebrow">Scene {activeScene + 1} of {story.scenes.length}</p>
          <h2>{scene.title}</h2>
          <p>{scene.text}</p>
          <p className="visualPrompt"><strong>Illustration prompt:</strong> {scene.visualPrompt}</p>
        </section>
      ) : (
        <p>{story.body}</p>
      )}

      <div className="actions">
        <button className="btn" onClick={speak}>Play narration</button>
        <button onClick={() => setActiveScene(Math.max(0, activeScene - 1))}>Previous</button>
        <button onClick={() => setActiveScene(Math.min(story.scenes.length - 1, activeScene + 1))}>Next</button>
        <button onClick={copyShareCard}>Copy share card</button>
        <button onClick={downloadJson}>Download export</button>
      </div>

      <p role="status">{status}</p>
    </article>
  );
}
