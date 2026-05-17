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

export async function createAssetFactoryJob(input: AssetFactoryStoryInput) {
  const baseUrl = process.env.ASSET_FACTORY_BASE_URL;
  const apiKey = process.env.ASSET_FACTORY_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Asset-Factory is not configured.");
  }

  const res = await fetch(`${baseUrl}/v1/jobs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    throw new Error(`Asset-Factory job failed: ${res.status}`);
  }

  return res.json() as Promise<{ job_id: string; status: string }>;
}
