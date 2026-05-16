import type { AgeBand } from './story';

export type UserRole = 'parent' | 'admin' | 'moderator' | 'creator' | 'internal';

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  defaultFamilyId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Family = {
  id: string;
  ownerUserId: string;
  memberUserIds: string[];
  plan: 'demo' | 'family_pro' | 'school' | 'enterprise';
  defaultSafetyPolicyId: string;
  createdAt: string;
  updatedAt: string;
};

export type ChildProfile = {
  id: string;
  familyId: string;
  displayName: string;
  ageBand: AgeBand;
  allowedThemes: string[];
  blockedThemes: string[];
  narratorPreference: string;
  bedtimeModeDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ParentSettings = {
  id: string;
  familyId: string;
  defaultPrivateStories: boolean;
  allowMemorySeeds: boolean;
  allowShareLinks: boolean;
  bedtimeModeDefault: boolean;
  analyticsConsent: boolean;
  retentionDays: number;
  createdAt: string;
  updatedAt: string;
};
