import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import type { Story } from '../types/story';
import { getFirebaseClientFirestore, hasFirebaseClientConfig } from './firebaseClient';
import { callGenerateStory, type CreateCloudStoryRequest } from './firebaseFunctions';

export function canUseCloudStories(): boolean {
  return hasFirebaseClientConfig();
}

function toStory(value: unknown): Story | null {
  if (!value || typeof value !== 'object') return null;
  const story = value as Story;
  return story.id ? story : null;
}

export async function createCloudStory(request: CreateCloudStoryRequest): Promise<Story> {
  const response = await callGenerateStory(request);

  if (response.status === 'blocked') {
    throw new Error(
      response.parentMessage ||
      response.blockedReasons?.join(', ') ||
      'Story was blocked by safety review.'
    );
  }

  const story = toStory(response.story);

  if (!story) {
    throw new Error('Cloud story response did not include a valid story.');
  }

  return story;
}

export async function listCloudStories(familyId: string): Promise<Story[]> {
  const db = getFirebaseClientFirestore();
  const storiesQuery = query(
    collection(db, 'stories'),
    where('familyId', '==', familyId),
    orderBy('createdAt', 'desc'),
    limit(25)
  );

  const snapshot = await getDocs(storiesQuery);

  return snapshot.docs
    .map((item) => toStory({ id: item.id, ...item.data() }))
    .filter((story): story is Story => Boolean(story));
}

export async function getCloudStory(storyId: string): Promise<Story | null> {
  const db = getFirebaseClientFirestore();
  const snapshot = await getDoc(doc(db, 'stories', storyId));

  if (!snapshot.exists()) return null;
  return toStory({ id: snapshot.id, ...snapshot.data() });
}
