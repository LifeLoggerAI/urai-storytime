'use client';

import { useEffect, useState } from 'react';
import { StoryReplay } from '../../../components/StoryReplay';
import { getLocalStory } from '../../../lib/localStoryStorage';
import type { Story } from '../../../types/story';

export default function StoryReplayClient({ storyId }: { storyId: string }) {
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    setStory(getLocalStory(storyId));
  }, [storyId]);

  if (!story) {
    return (
      <section className="card">
        <h1>Story not found</h1>
        <p>This story may exist only in the browser where it was created, or it may require cloud login.</p>
        <a className="btn" href="/create">Create a new story</a>
      </section>
    );
  }

  return <StoryReplay story={story} />;
}
