export type FiniteTimeApprovalStatus = "approved" | "not-approved";

export interface FiniteTimeApprovalRecord {
  artifactId: string;
  artifactSha256: `sha256:${string}`;
  approver: string;
  approvedAt: string;
  authenticatedReference: string;
  status: FiniteTimeApprovalStatus;
}

export interface FiniteTimeProviderAuthorization {
  provider: string;
  model: string;
  modelVersion: string;
  purpose: string;
  maxInitialCalls: number;
  maxRetries: number;
  maxCostPerCallUsd: number;
  maxPhaseCostUsd: number;
  retentionPolicy: string;
  trainingUse: "prohibited" | "allowed";
  commercialUseReviewed: boolean;
  likenessRestrictionsReviewed: boolean;
  fallbackProvider: string;
  acceptanceCriteria: string[];
}

export interface FiniteTimeFinalRenderAuthorization {
  schemaVersion: "finite-time-final-render-authorization-v1";
  projectId: "finite-time";
  chapterId: "farm-to-lake";
  sourceCommit: string;
  sourceManifestSha256: `sha256:${string}`;
  approvals: {
    animatic: FiniteTimeApprovalRecord;
    likeness: FiniteTimeApprovalRecord;
    rightsAndConsent: FiniteTimeApprovalRecord;
    narration: FiniteTimeApprovalRecord;
    narratorVoice: FiniteTimeApprovalRecord;
    scoreDirection: FiniteTimeApprovalRecord;
    privacyRetention: FiniteTimeApprovalRecord;
  };
  providers: FiniteTimeProviderAuthorization[];
  absoluteProjectCeilingUsd: number;
  perShotCeilingUsd: number;
  authorizedBy: string;
  authorizedAt: string;
  authorizationReference: string;
  finalRenderingAuthorized: boolean;
}

export const FARM_TO_LAKE_FINAL_RENDER_AUTHORIZATION: FiniteTimeFinalRenderAuthorization = {
  schemaVersion: "finite-time-final-render-authorization-v1",
  projectId: "finite-time",
  chapterId: "farm-to-lake",
  sourceCommit: "",
  sourceManifestSha256: "sha256:",
  approvals: {
    animatic: pending("animatic"),
    likeness: pending("likeness"),
    rightsAndConsent: pending("rights-and-consent"),
    narration: pending("narration"),
    narratorVoice: pending("narrator-voice"),
    scoreDirection: pending("score-direction"),
    privacyRetention: pending("privacy-retention")
  },
  providers: [],
  absoluteProjectCeilingUsd: 0,
  perShotCeilingUsd: 0,
  authorizedBy: "",
  authorizedAt: "",
  authorizationReference: "",
  finalRenderingAuthorized: false
};

function pending(artifactId: string): FiniteTimeApprovalRecord {
  return {
    artifactId,
    artifactSha256: "sha256:",
    approver: "",
    approvedAt: "",
    authenticatedReference: "",
    status: "not-approved"
  };
}

export interface FiniteTimeAuthorizationEvaluation {
  ready: boolean;
  blockers: string[];
  approvedCallCount: number;
  approvedRetryCount: number;
  absoluteProjectCeilingUsd: number;
}

export function evaluateFiniteTimeFinalRenderAuthorization(
  authorization: FiniteTimeFinalRenderAuthorization
): FiniteTimeAuthorizationEvaluation {
  const blockers: string[] = [];

  if (!/^[a-f0-9]{40}$/.test(authorization.sourceCommit)) blockers.push("source-commit-not-locked");
  if (!/^sha256:[a-f0-9]{64}$/.test(authorization.sourceManifestSha256)) blockers.push("source-manifest-not-locked");

  for (const [name, record] of Object.entries(authorization.approvals)) {
    if (record.status !== "approved") blockers.push(`${name}-not-approved`);
    if (!/^sha256:[a-f0-9]{64}$/.test(record.artifactSha256)) blockers.push(`${name}-artifact-not-locked`);
    if (!record.approver || !record.approvedAt || !record.authenticatedReference) blockers.push(`${name}-approval-incomplete`);
  }

  if (authorization.providers.length === 0) blockers.push("no-provider-model-authorized");

  let approvedCallCount = 0;
  let approvedRetryCount = 0;
  for (const provider of authorization.providers) {
    approvedCallCount += provider.maxInitialCalls;
    approvedRetryCount += provider.maxRetries;
    if (!provider.provider || !provider.model || !provider.modelVersion) blockers.push("provider-model-version-incomplete");
    if (provider.maxInitialCalls <= 0) blockers.push("provider-call-ceiling-missing");
    if (provider.maxRetries < 0) blockers.push("provider-retry-ceiling-invalid");
    if (provider.maxCostPerCallUsd <= 0 || provider.maxPhaseCostUsd <= 0) blockers.push("provider-cost-ceiling-missing");
    if (provider.trainingUse !== "prohibited") blockers.push("provider-training-use-not-prohibited");
    if (!provider.commercialUseReviewed || !provider.likenessRestrictionsReviewed) blockers.push("provider-terms-review-incomplete");
    if (provider.acceptanceCriteria.length === 0) blockers.push("provider-acceptance-criteria-missing");
  }

  if (authorization.absoluteProjectCeilingUsd <= 0) blockers.push("absolute-project-ceiling-missing");
  if (authorization.perShotCeilingUsd <= 0) blockers.push("per-shot-ceiling-missing");
  if (!authorization.authorizedBy || !authorization.authorizedAt || !authorization.authorizationReference) blockers.push("final-authorization-signature-incomplete");
  if (!authorization.finalRenderingAuthorized) blockers.push("final-rendering-not-authorized");

  return {
    ready: blockers.length === 0,
    blockers: [...new Set(blockers)].sort(),
    approvedCallCount,
    approvedRetryCount,
    absoluteProjectCeilingUsd: authorization.absoluteProjectCeilingUsd
  };
}
