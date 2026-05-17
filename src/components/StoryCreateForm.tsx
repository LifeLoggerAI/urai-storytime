'use client';

import { useState } from 'react';
import type { AgeBand, Story, StoryMood, StoryRequest } from '../types/story';
import { createStoryManifest } from '../story-engine/StoryEngine';
import { saveLocalStory } from '../lib/localStoryStorage';
import { trackEvent } from '../lib/analytics';

const moods: StoryMood[] = ['gentle', 'playful', 'brave', 'sleepy', 'curious', 'comforting'];
const ageBands: AgeBand[] = ['preschool_3_5', 'early_reader_6_8', 'middle_grade_9_12', 'teen_13_17', 'adult_demo'];

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function StoryCreateForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'blocked' | 'error'>('idle');
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState('');

  async function submit(formData: FormData) {
    setStatus('loading');
    setError('');
    await trackEvent('story_create_started', { mode: 'local_demo' });

    const request: StoryRequest = {
      id: makeId('request'),
      familyId: 'local_demo_family',
      childProfileId: 'local_demo_child',
      requestedByUserId: 'local_demo_parent',
      childDisplayName: String(formData.get('childDisplayName') || 'Ari').slice(0, 32),
      ageBand: String(formData.get('ageBand') || 'early_reader_6_8') as AgeBand,
      theme: String(formData.get('theme') || 'Moon Garden').slice(0, 80),
      mood: String(formData.get('mood') || 'gentle') as StoryMood,
      narratorId: String(formData.get('narratorId') || 'gentle_firefly'),
      prompt: String(formData.get('prompt') || '').slice(0, 700),
      memorySeedIds: [],
      bedtimeMode: formData.get('bedtimeMode') === 'on',
      createdAt: new Date().toISOString()
    };

    try {
      const result = await createStoryManifest(request);

      if (result.story.status === 'blocked') {
        setStatus('blocked');
        setError(result.story.summary);
        await trackEvent('story_create_blocked', { reasonCount: result.precheck.blockedReasons.length });
        return;
      }

      saveLocalStory(result.story);
      setStory(result.story);
      setStatus('ready');
      await trackEvent('story_create_completed', { mode: 'local_demo', sceneCount: result.story.scenes.length });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Story generation failed.');
    }
  }

  return (
    <section className="card">
      <h1>Create a Story</h1>
      <p className="notice">Local demo mode saves this story in your browser only. Avoid entering sensitive real child information.</p>

      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(new FormData(event.currentTarget));
        }}
      >
        <label>
          Child display name
          <input name="childDisplayName" maxLength={32} defaultValue="Ari" required />
        </label>

        <label>
          Age band
          <select name="ageBand" defaultValue="early_reader_6_8">
            {ageBands.map((band) => <option key={band} value={band}>{band.replaceAll('_', ' ')}</option>)}
          </select>
        </label>

        <label>
          Theme
          <input name="theme" maxLength={80} defaultValue="Moon Garden" required />
        </label>

        <label>
          Mood
          <select name="mood" defaultValue="gentle">
            {moods.map((mood) => <option key={mood} value={mood}>{mood}</option>)}
          </select>
        </label>

        <label>
          Narrator
          <select name="narratorId" defaultValue="gentle_firefly">
            <option value="gentle_firefly">Gentle Firefly</option>
            <option value="warm_parent">Warm Parent</option>
            <option value="grandparent">Grandparent</option>
            <option value="storybook_guide">Storybook Guide</option>
            <option value="calm_bedtime">Calm Bedtime</option>
          </select>
        </label>

        <label>
          Parent prompt
          <textarea name="prompt" rows={4} maxLength={700} placeholder="A calm journey about friendship and courage." />
        </label>

        <label className="inline">
          <input name="bedtimeMode" type="checkbox" defaultChecked />
          Bedtime calm mode
        </label>

        <button className="btn" disabled={status === 'loading'}>
          {status === 'loading' ? 'Creating safely...' : 'Generate story'}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      {story && (
        <article className="storyResult">
          <h2>{story.title}</h2>
          <p>{story.body}</p>
          <a className="btn secondary" href={`/story/${story.id}`}>Open replay</a>
        </article>
      )}
    </section>
  );
}
