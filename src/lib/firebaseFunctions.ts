import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseClientApp, hasFirebaseClientConfig } from './firebaseClient';

export interface CreateCloudStoryRequest {
  familyId: string;
  childProfileId: string;
  childDisplayName: string;
  ageBand: string;
  theme: string;
  mood: string;
  prompt: string;
  narratorId?: string;
}

export interface CloudStory {
  id: string;
  familyId?: string;
  title?: string;
  summary?: string;
  body?: string;
  scenes?: unknown[];
  status?: string;
  [key: string]: unknown;
}

export interface CreateCloudStoryResponse {
  status: 'ready' | 'blocked';
  story?: CloudStory;
  parentMessage?: string;
  blockedReasons?: string[];
}

export function canUseFirebaseFunctions(): boolean {
  return hasFirebaseClientConfig();
}

export function getStorytimeFunctions() {
  return getFunctions(getFirebaseClientApp());
}

export async function callGenerateStory(data: CreateCloudStoryRequest): Promise<CreateCloudStoryResponse> {
  const generateStory = httpsCallable<CreateCloudStoryRequest, CreateCloudStoryResponse>(
    getStorytimeFunctions(),
    'generateStory'
  );

  const result = await generateStory(data);
  return result.data;
}
