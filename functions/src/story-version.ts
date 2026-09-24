import { createHash } from "node:crypto";

export const STORY_VERSION_SCHEMA_VERSION = "story-version-v1" as const;

export interface InitialStoryVersionInput {
  id: string;
  userId: string;
  sessionId: string;
  createdAt: string;
  title: string;
  provider: string;
  locale: string;
  audienceAgeBand: string;
  consentVersion: string;
  provenance: Record<string, unknown>;
  chapter: {
    id: string;
    title: string;
    summary: string;
  };
  moment: {
    id: string;
    title: string;
    body: string;
  };
  narrator: {
    id: string;
    text: string;
  };
  emotionalArc: {
    id: string;
    arcLabel: string;
    summary: string;
  };
}

function sha256(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function buildInitialStoryVersionRecord(input: InitialStoryVersionInput) {
  const snapshot = {
    title: input.title,
    provider: input.provider,
    locale: input.locale,
    audienceAgeBand: input.audienceAgeBand,
    consentVersion: input.consentVersion,
    provenance: input.provenance,
    chapter: input.chapter,
    moment: input.moment,
    narrator: input.narrator,
    emotionalArc: input.emotionalArc
  };

  return {
    schemaVersion: STORY_VERSION_SCHEMA_VERSION,
    id: input.id,
    userId: input.userId,
    sessionId: input.sessionId,
    versionNumber: 1,
    parentVersionId: null,
    reason: "initial_generation",
    status: "committed",
    immutable: true,
    snapshot,
    contentSha256: sha256(snapshot),
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}
