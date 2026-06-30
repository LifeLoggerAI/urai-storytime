'use client';

import { useState } from 'react';
import type { AgeBand, Story, StoryMood, StoryRequest } from '../types/story';
import { CloudFamilyModePanel } from './CloudFamilyModePanel';
import { createCloudStory } from '../lib/cloudStoryService';
import { canAttemptCloudFamilyWrite, useCloudFamily } from '../lib/cloudFamilyContext';
import { createStoryManifest } from '../story-engine/StoryEngine';
import { saveLocalStory } from '../lib/localStoryStorage';
import { trackEvent } from '../lib/analytics';

const moods: StoryMood[] = ['gentle', 'playful', 'brave', 'sleepy', 'curious', 'comforting'];
const ageBands: AgeBand[] = ['preschool_3_5', 'early_reader_6_8', 'middle_grade_9_12', 'teen_13_17', 'adult_demo'];

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formText(formData: FormData, key: string, fallback: string, maxLength: number) {
  return String(formData.get(key) || fallback).trim().slice(0, maxLength) || fallback;
}

function formEnum<T extends string>(formData: FormData, key: string, allowedValues: readonly T[], fallback: T): T {
  const value = String(formData.get(key) || '');
  return allowedValues.includes(value as T) ? (value as T) : fallback;
}

export function StoryCreateForm() {
  const cloud = useCloudFamily();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'blocked' | 'error'>('idle');
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'local_demo' | 'cloud_family'>('local_demo');

  async function submit(formData: FormData) {
    setStatus('loading');
    setError('');

    const childDisplayName = formText(formData, 'childDisplayName', 'Ari', 32);
    const ageBand = formEnum(formData, 'ageBand', ageBands, 'early_reader_6_8');
    const theme = formText(formData, 'theme', 'Moon Garden', 80);
    const mood = formEnum(formData, 'mood', moods, 'gentle');
    const narratorId = formText(formData, 'narratorId', 'gentle_firefly', 80);
    const prompt = formText(formData, 'prompt', '', 700);
    const shouldTryCloud = canAttemptCloudFamilyWrite(cloud);

    await trackEvent('story_create_started', {
      mode: shouldTryCloud ? 'cloud_family' : 'local_demo'
    });

    try {
      if (shouldTryCloud && cloud.user) {
        const cloudStory = await createCloudStory({
          familyId: cloud.activeFamilyId,
          childProfileId: 'cloud_child_profile_pending',
          childDisplayName,
          ageBand,
          theme,
          mood,
          narratorId,
          prompt
        });

        saveLocalStory(cloudStory);
        setStory(cloudStory);
        setMode('cloud_family');
        setStatus('ready');
        await trackEvent('story_create_completed', {
          mode: 'cloud_family',
          sceneCount: cloudStory.scenes.length
        });
        return;
      }

      const request: StoryRequest = {
        id: makeId('request'),
        familyId: 'local_demo_family',
        childProfileId: 'local_demo_child',
        requestedByUserId: 'local_demo_parent',
        childDisplayName,
        ageBand,
        theme,
        mood,
        narratorId,
        prompt,
        memorySeedIds: [],
        bedtimeMode: formData.get('bedtimeMode') === 'on',
        createdAt: new Date().toISOString()
      };

      const result = await createStoryManifest(request);

      if (result.story.status === 'blocked') {
        setStatus('blocked');
        setError(result.story.summary);
        await trackEvent('story_create_blocked', { reasonCount: result.precheck.blockedReasons.length });
        return;
      }

      saveLocalStory(result.story);
      setStory(result.story);
      setMode('local_demo');
      setStatus('ready');
      await trackEvent('story_create_completed', { mode: 'local_demo', sceneCount: result.story.scenes.length });
    } catch (err) {
      setStatus('error');
      setMode(shouldTryCloud ? 'cloud_family' : 'local_demo');
      setError(
        err instanceof Error
          ? `${err.message} Local Demo Mode is still available if Cloud Family Mode is not ready.`
          : 'Story generation failed. Local Demo Mode is still available.'
      );
    }
  }

  return (
    <section className="card">
      <h1>Create a Story</h1>
      <CloudFamilyModePanel cloud={cloud} />
      <p className="notice">
        {mode === 'cloud_family'
          ? 'Cloud Family Mode attempted this story. Firebase rules and Functions enforce membership.'
          : 'Local Demo Mode saves this story in your browser only. Avoid entering sensitive real child information.'}
      </p>

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
