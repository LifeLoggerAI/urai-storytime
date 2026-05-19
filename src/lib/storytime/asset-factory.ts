import type { StoryChapter, StorySession } from "./types";

export interface AssetFactoryStoryInput {
  story_input: {
    title: string;
    scenes: {
      scene_number: number;
      prompt: string;
      narration: string;
    }[];
  };
  mood: string;
  audience: "private_user" | "family" | "public_safe";
  platform_targets: string[];
}

export interface AssetFactoryJobResponse {
  job_id: string;
  status: string;
}

export interface AssetFactoryJobStatus {
  job_id: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | string;
  asset_bundle_url?: string;
  download_url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface StorytimeAssetIngestionRecord {
  sessionId: string;
  assetFactoryJobId: string;
  status: AssetFactoryJobStatus["status"];
  bundleUrl?: string;
  recordedAt: string;
  source: "asset_factory";
}

function getAssetFactoryConfig() {
  const baseUrl = process.env.ASSET_FACTORY_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.ASSET_FACTORY_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Asset-Factory is not configured.");
  }

  return { baseUrl, apiKey };
}

async function requestAssetFactory<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { baseUrl, apiKey } = getAssetFactoryConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      ...(init.headers || {})
    }
  });

  if (!res.ok) {
    throw new Error(`Asset-Factory request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function toAssetFactoryInput(session: StorySession, chapters: StoryChapter[]): AssetFactoryStoryInput {
  return {
    story_input: {
      title: session.title,
      scenes: chapters.map((chapter) => ({
        scene_number: chapter.order,
        prompt: chapter.summary,
        narration: chapter.summary
      }))
    },
    mood: session.emotionalTone,
    audience: session.visibility === "public_safe" ? "public_safe" : "private_user",
    platform_targets: ["urai_storytime"]
  };
}

export async function createAssetFactoryJob(input: AssetFactoryStoryInput): Promise<AssetFactoryJobResponse> {
  return requestAssetFactory<AssetFactoryJobResponse>("/v1/jobs", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getAssetFactoryJobStatus(jobId: string): Promise<AssetFactoryJobStatus> {
  if (!jobId.trim()) {
    throw new Error("Asset-Factory job id is required.");
  }

  return requestAssetFactory<AssetFactoryJobStatus>(`/v1/jobs/${encodeURIComponent(jobId)}`);
}

export function toStorytimeAssetIngestionRecord(
  sessionId: string,
  status: AssetFactoryJobStatus
): StorytimeAssetIngestionRecord {
  if (!sessionId.trim()) {
    throw new Error("Storytime session id is required for asset ingestion.");
  }

  return {
    sessionId,
    assetFactoryJobId: status.job_id,
    status: status.status,
    bundleUrl: status.asset_bundle_url || status.download_url,
    recordedAt: new Date().toISOString(),
    source: "asset_factory"
  };
}
