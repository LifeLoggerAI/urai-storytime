export const STORYTIME_MEDIA_JOB_SCHEMA_VERSION = "storytime-media-job-v1" as const;

export type StorytimeMediaJobKind = "voiceover" | "illustration" | "audio_package" | "asset_factory_package";
export type StorytimeMediaJobState = "hard_off";

export interface StorytimeMediaJobContract {
  schemaVersion: typeof STORYTIME_MEDIA_JOB_SCHEMA_VERSION;
  sourceSystem: "urai-storytime";
  storySessionId: string;
  storyVersionId?: string;
  userId: string;
  jobKind: StorytimeMediaJobKind;
  state: StorytimeMediaJobState;
  provider: "asset_factory" | "tts_provider" | "image_provider";
  providerSpendAuthorized: false;
  publicReleaseAuthorized: false;
  consent: {
    mediaGeneration: true;
    providerProcessing: true;
    voiceUse?: true;
    consentVersion: string;
  };
  provenance: {
    sourceStoryProvenanceVersion: string;
    sourceStorySessionId: string;
    fictionalized: boolean;
    aiGenerated: boolean;
  };
  costPolicy: {
    currency: "USD";
    maxAuthorizedCost: 0;
  };
  requestedAt: string;
}

export function buildHardOffStorytimeMediaJob(
  input: Omit<StorytimeMediaJobContract, "schemaVersion" | "sourceSystem" | "state" | "providerSpendAuthorized" | "publicReleaseAuthorized" | "costPolicy">
): StorytimeMediaJobContract {
  if (!input.storySessionId.trim() || !input.userId.trim()) {
    throw new Error("Storytime media job requires story and owner authority.");
  }
  if (!input.consent.consentVersion.trim()) {
    throw new Error("Storytime media job requires versioned consent.");
  }
  if (input.jobKind === "voiceover" && input.consent.voiceUse !== true) {
    throw new Error("Voiceover preparation requires explicit voice-use consent.");
  }

  return {
    ...input,
    schemaVersion: STORYTIME_MEDIA_JOB_SCHEMA_VERSION,
    sourceSystem: "urai-storytime",
    state: "hard_off",
    providerSpendAuthorized: false,
    publicReleaseAuthorized: false,
    costPolicy: {
      currency: "USD",
      maxAuthorizedCost: 0
    }
  };
}

export function assertStorytimeMediaExecutionHardOff() {
  if (process.env.STORYTIME_MEDIA_EXECUTION === "true") {
    throw new Error(
      "STORYTIME_MEDIA_EXECUTION cannot be enabled until a reviewed worker, provider receipts, deletion handling, budgets, and runtime evidence exist."
    );
  }
  return true;
}
