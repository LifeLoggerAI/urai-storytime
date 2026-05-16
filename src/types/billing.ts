export type PlanId = 'demo' | 'family_pro' | 'school' | 'enterprise';

export type Entitlement = {
  id: string;
  userId: string;
  familyId?: string;
  plan: PlanId;
  status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'cancelled';
  storyLimitMonthly: number;
  cloudLibraryEnabled: boolean;
  narrationEnabled: boolean;
  adminEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};
