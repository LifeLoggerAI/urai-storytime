'use client';

import { useEffect, useState } from 'react';
import type { Story } from '../../types/story';
import { deleteLocalStory, listLocalStories } from '../../lib/localStoryStorage';

export default function LibraryPage() {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    setStories(listLocalStories());
  }, []);

  function remove(id: string) {
    deleteLocalStory(id);
    setStories(listLocalStories());
  }

  if (!stories.length) {
    return (
      <section className="card">
        <h1>Your Story Archive</h1>
        <p>No stories yet. Create a gentle first story to begin your family archive.</p>
        <a className="btn" href="/create">Create story</a>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>Your Story Archive</h1>
      <div className="grid">
        {stories.map((story) => (
          <article className="storyCard" key={story.id}>
            <h2>{story.title}</h2>
            <p>{story.summary}</p>
            <a className="btn secondary" href={`/story/${story.id}`}>Replay</a>
            <button onClick={() => remove(story.id)}>Delete</button>
          </article>
        ))}
      </div>
    </section>
  );
}
