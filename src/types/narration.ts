export type NarratorStyle = 'warm_parent' | 'gentle_firefly' | 'grandparent' | 'storybook_guide' | 'calm_bedtime';

export type NarratorProfile = {
  id: string;
  name: string;
  style: NarratorStyle;
  description: string;
  voiceProvider?: 'web_speech' | 'openai' | 'elevenlabs' | 'google_tts';
};

export type NarrationJob = {
  id: string;
  familyId: string;
  storyId: string;
  narratorId: string;
  provider: 'web_speech' | 'tts_provider';
  status: 'queued' | 'processing' | 'complete' | 'failed';
  audioAssetIds: string[];
  captionTrackId?: string;
  createdAt: string;
  completedAt?: string;
};

export type CaptionCue = {
  startMs: number;
  endMs: number;
  text: string;
};
