import StoryReplayClient from './StoryReplayClient';

export default function StoryPage({ params }: { params: { storyId: string } }) {
  return <StoryReplayClient storyId={params.storyId} />;
}
