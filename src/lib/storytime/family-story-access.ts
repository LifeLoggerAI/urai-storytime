/**
 * Review-only Family Stories authorization contract.
 *
 * This is a pure, fail-closed policy predicate over server-verified snapshots,
 * NOT a Firebase Auth verifier, Firestore Rules replacement, grant issuer,
 * permission to enable private-memory writes, or deployed family-sharing API.
 * The backend must obtain auth/consent/deletion state from trusted authorities
 * in the same authorization context and enforce the result server-side.
 * Kinship, a person appearing in a photo, and graph traversal grant nothing.
 */
export type FamilyStoryAction = "view_story" | "view_replay";
export type FamilyStoryDecisionReason =
  | "owner"
  | "named_grant"
  | "unauthenticated"
  | "source_unavailable"
  | "consent_inactive"
  | "replay_consent_inactive"
  | "grant_missing"
  | "grant_invalid"
  | "grant_inactive"
  | "grant_stale"
  | "grant_expired"
  | "scope_denied";

export interface VerifiedFamilyStoryActor {
  /** Derived from verified server-side Firebase identity, never client input. */
  uid: string;
  verified: boolean;
}
export interface FamilyStoryAuthoritySnapshot {
  storyId: string;
  ownerUid: string;
  sourceRevision: string;
  /** Increase on any visibility/consent revocation; monotonic per owner/story. */
  shareEpoch: number;
  lifecycle: "active" | "deleting" | "deleted";
  ownerAccountActive: boolean;
  sourceConsentActive: boolean;
  replayConsentActive: boolean;
}
export interface FamilyNamedShareGrant {
  grantId: string;
  storyId: string;
  ownerUid: string;
  recipientUid: string;
  sourceRevision: string;
  shareEpoch: number;
  status: "active" | "revoked" | "expired";
  ownerApproved: boolean;
  scopes: FamilyStoryAction[];
  issuedAtMs: number;
  expiresAtMs: number;
}
export interface FamilyStoryAccessRequest {
  actor: VerifiedFamilyStoryActor | null;
  story: FamilyStoryAuthoritySnapshot | null;
  action: FamilyStoryAction;
  grant?: FamilyNamedShareGrant | null;
  /** Server-supplied evaluation time; never trust client clocks. */
  nowMs: number;
}
export type FamilyStoryDecision =
  | { allowed: true; reason: "owner" | "named_grant" }
  | { allowed: false; reason: Exclude<FamilyStoryDecisionReason, "owner" | "named_grant"> };

const deny = (reason: Extract<FamilyStoryDecision, { allowed: false }>["reason"]): FamilyStoryDecision =>
  ({ allowed: false, reason });

function validId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256 &&
    value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}
function validEpoch(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function validTime(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/**
 * Story projection only. Raw audio/photo download and any multi-owner story
 * linking require their own authoritative, media-scoped and mutual-grant checks.
 * This function intentionally accepts no relationship-graph edge or group.
 */
export function evaluateFamilyStoryAccess(input: FamilyStoryAccessRequest): FamilyStoryDecision {
  const { actor, story, grant, action, nowMs } = input;
  if (!actor || actor.verified !== true || !validId(actor.uid) || !validTime(nowMs)) {
    return deny("unauthenticated");
  }
  if (!story || !validId(story.storyId) || !validId(story.ownerUid) ||
      !validId(story.sourceRevision) || !validEpoch(story.shareEpoch) ||
      story.lifecycle !== "active" || story.ownerAccountActive !== true) {
    return deny("source_unavailable");
  }
  if (story.sourceConsentActive !== true) return deny("consent_inactive");
  if (action !== "view_story" && action !== "view_replay") return deny("scope_denied");
  if (action === "view_replay" && story.replayConsentActive !== true) {
    return deny("replay_consent_inactive");
  }

  if (actor.uid === story.ownerUid) return { allowed: true, reason: "owner" };

  if (!grant) return deny("grant_missing");
  if (!validId(grant.grantId) || !validId(grant.ownerUid) ||
      !validId(grant.recipientUid) || !validId(grant.storyId) ||
      !validId(grant.sourceRevision) || !validEpoch(grant.shareEpoch) ||
      !validTime(grant.issuedAtMs) || !validTime(grant.expiresAtMs) ||
      !Array.isArray(grant.scopes) || grant.ownerApproved !== true ||
      grant.ownerUid !== story.ownerUid || grant.recipientUid !== actor.uid ||
      grant.storyId !== story.storyId) {
    return deny("grant_invalid");
  }
  if (grant.status !== "active") return deny("grant_inactive");
  if (grant.sourceRevision !== story.sourceRevision || grant.shareEpoch !== story.shareEpoch) {
    return deny("grant_stale");
  }
  if (grant.issuedAtMs > nowMs || grant.expiresAtMs <= nowMs ||
      grant.expiresAtMs <= grant.issuedAtMs) {
    return deny("grant_expired");
  }
  if (!grant.scopes.some((scope) => scope === action)) return deny("scope_denied");
  return { allowed: true, reason: "named_grant" };
}
