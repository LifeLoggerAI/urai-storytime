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

  const requiredApprovals = [
    "animatic",
    "likeness",
    "rightsAndConsent",
    "narration",
    "narratorVoice",
    "scoreDirection",
    "privacyRetention"
  ] as const;
  const approvals = authorization.approvals as Partial<Record<(typeof requiredApprovals)[number], FiniteTimeApprovalRecord>>;
  for (const name of requiredApprovals) {
    const record = approvals?.[name];
    if (!record) {
      blockers.push(`${name}-approval-missing`);
      continue;
    }
    if (record.status !== "approved") blockers.push(`${name}-not-approved`);
    if (!/^sha256:[a-f0-9]{64}$/.test(record.artifactSha256)) blockers.push(`${name}-artifact-not-locked`);
    if (!record.approver || !record.approvedAt || !record.authenticatedReference) blockers.push(`${name}-approval-incomplete`);
  }

  if (authorization.providers.length === 0) blockers.push("no-provider-model-authorized");

  let approvedCallCount = 0;
  let approvedRetryCount = 0;
  let authorizedPhaseTotalUsd = 0;
  for (const provider of authorization.providers) {
    approvedCallCount += provider.maxInitialCalls;
    approvedRetryCount += provider.maxRetries;
    if (!provider.provider || !provider.model || !provider.modelVersion) blockers.push("provider-model-version-incomplete");
    if (!Number.isInteger(provider.maxInitialCalls) || provider.maxInitialCalls <= 0) blockers.push("provider-call-ceiling-missing");
    if (!Number.isInteger(provider.maxRetries) || provider.maxRetries < 0) blockers.push("provider-retry-ceiling-invalid");

    const costInputsAreFinite = Number.isFinite(provider.maxCostPerCallUsd)
      && Number.isFinite(provider.maxPhaseCostUsd);
    if (!costInputsAreFinite || provider.maxCostPerCallUsd <= 0 || provider.maxPhaseCostUsd <= 0) {
      blockers.push("provider-cost-ceiling-missing");
    } else {
      authorizedPhaseTotalUsd += provider.maxPhaseCostUsd;
      if (provider.maxCostPerCallUsd > authorization.perShotCeilingUsd) {
        blockers.push("provider-call-cost-exceeds-per-shot-ceiling");
      }
      if (provider.maxPhaseCostUsd > authorization.absoluteProjectCeilingUsd) {
        blockers.push("provider-phase-cost-exceeds-project-ceiling");
      }
      const worstCaseProviderCostUsd = provider.maxCostPerCallUsd
        * (provider.maxInitialCalls + provider.maxRetries);
      if (!Number.isFinite(worstCaseProviderCostUsd) || worstCaseProviderCostUsd > provider.maxPhaseCostUsd) {
        blockers.push("provider-call-budget-exceeds-phase-ceiling");
      }
    }
    if (provider.trainingUse !== "prohibited") blockers.push("provider-training-use-not-prohibited");
    if (!provider.commercialUseReviewed || !provider.likenessRestrictionsReviewed) blockers.push("provider-terms-review-incomplete");
    if (provider.acceptanceCriteria.length === 0) blockers.push("provider-acceptance-criteria-missing");
  }

  if (authorization.absoluteProjectCeilingUsd <= 0) blockers.push("absolute-project-ceiling-missing");
  if (authorization.perShotCeilingUsd <= 0) blockers.push("per-shot-ceiling-missing");
  if (!Number.isFinite(authorization.absoluteProjectCeilingUsd) || !Number.isFinite(authorization.perShotCeilingUsd)) {
    blockers.push("project-cost-ceiling-invalid");
  }
  if (authorizedPhaseTotalUsd > authorization.absoluteProjectCeilingUsd) {
    blockers.push("provider-phase-total-exceeds-project-ceiling");
  }
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
