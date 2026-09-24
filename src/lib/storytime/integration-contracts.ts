export type StorytimePrivacyClass = "owner_only" | "family_private" | "public_safe";
export type StorytimeActivationState = "hard_off" | "eligible_for_staging" | "approved";

export const STORYTIME_INTEGRATION_SCHEMA_VERSION = "storytime-integration-envelope-v1" as const;

export interface StorytimeProvenanceReference {
  sourceType: "direct_input" | "memory_snapshot" | "story_version" | "finite_time_canon";
  sourceId: string;
  sourceVersion?: string;
  consentVersion: string;
  fictionalized: boolean;
  aiGenerated: boolean;
  edited: boolean;
}

export interface StorytimeIntegrationEnvelope<TPayload> {
  schemaVersion: typeof STORYTIME_INTEGRATION_SCHEMA_VERSION;
  sourceSystem: "urai-storytime";
  sourceAuthority: {
    repository: "LifeLoggerAI/urai-storytime";
    storySessionId: string;
    storyVersionId?: string;
  };
  destinationSystem: "urai-studio" | "asset-factory" | "urai-content" | "urai-spatial";
  privacyClass: StorytimePrivacyClass;
  activationState: StorytimeActivationState;
  publicReleaseAuthorized: false;
  providerSpendAuthorized: false;
  generatedAt: string;
  provenance: StorytimeProvenanceReference[];
  payload: TPayload;
}

export interface StudioNarrativeGraphPayload {
  title: string;
  chapters: Array<{
    chapterId: string;
    order: number;
    title: string;
    summary: string;
    narratorScriptId?: string;
  }>;
  requestedOutputs: Array<"storyboard" | "animatic" | "audio" | "video">;
}

export interface ContentStoryPackagePayload {
  title: string;
  formatId: string;
  locale: string;
  narratorText: string[];
  editorialState: "draft" | "review_required";
}

export interface SpatialReplayManifestPayload {
  title: string;
  scenes: Array<{
    sceneId: string;
    order: number;
    narration: string;
    assetRefs: string[];
  }>;
  fallback: {
    textRequired: true;
    captionsRequired: true;
    reducedMotionRequired: true;
  };
}

function assertPrivateFoundation(args: {
  storySessionId: string;
  privacyClass: StorytimePrivacyClass;
  provenance: StorytimeProvenanceReference[];
}) {
  if (!args.storySessionId.trim()) throw new Error("Storytime integration requires a story session id.");
  if (args.privacyClass === "public_safe") {
    throw new Error("Public integration promotion requires a separate reviewed release process.");
  }
  if (args.provenance.length === 0) {
    throw new Error("Storytime integration requires at least one provenance reference.");
  }
  for (const item of args.provenance) {
    if (!item.sourceId.trim() || !item.consentVersion.trim()) {
      throw new Error("Storytime provenance requires source identity and consent version.");
    }
  }
}

export function buildHardOffStorytimeIntegration<TPayload>(args: {
  storySessionId: string;
  storyVersionId?: string;
  destinationSystem: StorytimeIntegrationEnvelope<TPayload>["destinationSystem"];
  privacyClass: Exclude<StorytimePrivacyClass, "public_safe">;
  provenance: StorytimeProvenanceReference[];
  payload: TPayload;
  generatedAt?: string;
}): StorytimeIntegrationEnvelope<TPayload> {
  assertPrivateFoundation(args);
  return {
    schemaVersion: STORYTIME_INTEGRATION_SCHEMA_VERSION,
    sourceSystem: "urai-storytime",
    sourceAuthority: {
      repository: "LifeLoggerAI/urai-storytime",
      storySessionId: args.storySessionId,
      storyVersionId: args.storyVersionId
    },
    destinationSystem: args.destinationSystem,
    privacyClass: args.privacyClass,
    activationState: "hard_off",
    publicReleaseAuthorized: false,
    providerSpendAuthorized: false,
    generatedAt: args.generatedAt || new Date().toISOString(),
    provenance: args.provenance,
    payload: args.payload
  };
}

export function assertStorytimeIntegrationIsHardOff(envelope: StorytimeIntegrationEnvelope<unknown>) {
  if (
    envelope.activationState !== "hard_off"
    || envelope.publicReleaseAuthorized !== false
    || envelope.providerSpendAuthorized !== false
  ) {
    throw new Error("Storytime future-system integration must remain hard-off until separately approved.");
  }
}
