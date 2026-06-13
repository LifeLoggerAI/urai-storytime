import { PageProps } from '@/lib/types';
import StoryReplayClient from './StoryReplayClient';

export default function StoryPage({ params }: PageProps) {
  return <StoryReplayClient storyId={params.storyId} />;
}
