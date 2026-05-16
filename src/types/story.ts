export type AgeBand = 'preschool_3_5' | 'early_reader_6_8' | 'middle_grade_9_12' | 'teen_13_17' | 'adult_demo';
export type StoryMood = 'gentle' | 'playful' | 'brave' | 'sleepy' | 'curious' | 'comforting';
export type StoryStatus = 'draft' | 'blocked' | 'generating' | 'ready' | 'failed' | 'archived';

export type StoryScene = {
  id: string;
  storyId: string;
  familyId: string;
  index: number;
  title: string;
  text: string;
  emotion: StoryMood;
  motif: string;
  visualPrompt: string;
  captionStartMs: number;
  captionEndMs: number;
};

export type StoryRequest = {
  id: string;
  familyId: string;
  childProfileId: string;
  requestedByUserId: string;
  childDisplayName: string;
  ageBand: AgeBand;
  theme: string;
  mood: StoryMood;
  narratorId: string;
  prompt: string;
  memorySeedIds: string[];
  bedtimeMode: boolean;
  createdAt: string;
};

export type Story = {
  id: string;
  familyId: string;
  childProfileId: string;
  storyRunId: string;
  title: string;
  summary: string;
  body: string;
  scenes: StoryScene[];
  narratorId: string;
  mood: StoryMood;
  theme: string;
  safetyReviewId: string;
  status: StoryStatus;
  visibility: 'private' | 'family' | 'shared_link';
  createdAt: string;
  updatedAt: string;
};

export type StoryRun = {
  id: string;
  requestId: string;
  familyId: string;
  provider: 'local_demo' | 'openai' | 'mock';
  status: 'queued' | 'running' | 'blocked' | 'complete' | 'failed';
  safetyPrecheckId?: string;
  safetyPostcheckId?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
};
