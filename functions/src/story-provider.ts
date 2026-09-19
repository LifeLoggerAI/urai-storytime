export interface StoryProviderInput {
  title: string;
  sourceText?: string;
  emotionalTone: string;
  symbolicMotifs: string[];
}

export interface StoryProviderOutput {
  chapterTitle: string;
  chapterSummary: string;
  momentTitle: string;
  momentBody: string;
  narratorText: string;
  scenePrompt: string;
  visualMood: string;
  audioMood: string;
  arcLabel: string;
  arcSummary: string;
  peakTone: string;
  resolutionTone: string;
}

export function getStoryProviderReadiness(apiKey = "") {
  const provider = process.env.STORYTIME_GENERATION_PROVIDER || "disabled";
  const missing = [];
  if (provider !== "openai") missing.push("STORYTIME_GENERATION_PROVIDER=openai");
  if (!apiKey.trim()) missing.push("OPENAI_API_KEY secret");
  if (!process.env.STORYTIME_OPENAI_MODEL?.trim()) missing.push("STORYTIME_OPENAI_MODEL");
  return {
    provider,
    ready: provider === "openai" && missing.length === 0,
    missing
  };
}

async function moderateWithProvider(apiKey: string, text: string, phase: "input" | "output") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) throw new Error(`Story provider ${phase} moderation unavailable (HTTP ${response.status}).`);
  const payload = await response.json() as { results?: Array<{ flagged?: boolean }> };
  if (payload.results?.[0]?.flagged === true) {
    throw new Error(`Story provider ${phase} blocked by safety policy.`);
  }
}

function assertStringRecord(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Story provider returned invalid JSON.");
  }
}

function readString(record: Record<string, unknown>, key: keyof StoryProviderOutput, fallback: string, maxLength: number) {
  const value = record[key];
  return (typeof value === "string" && value.trim() ? value.trim() : fallback).slice(0, maxLength);
}

export async function generateStoryWithProvider(input: StoryProviderInput, apiKey: string): Promise<StoryProviderOutput> {
  const readiness = getStoryProviderReadiness(apiKey);
  if (!readiness.ready) {
    throw new Error(`Story provider is not configured. Missing: ${readiness.missing.join(", ")}`);
  }

  const prompt = [
    "Create a family-safe private reflective Storytime session.",
    "Return JSON only with keys: chapterTitle, chapterSummary, momentTitle, momentBody, narratorText, scenePrompt, visualMood, audioMood, arcLabel, arcSummary, peakTone, resolutionTone.",
    "Do not diagnose, shame, intensify fear, expose private personal details, or create public-share text.",
    `Title: ${input.title}`,
    `Tone: ${input.emotionalTone}`,
    `Motifs: ${input.symbolicMotifs.join(", ") || "soft light"}`,
    `Source: ${input.sourceText || "No source text provided."}`
  ].join("\n");

  await moderateWithProvider(apiKey, prompt, "input");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.STORYTIME_OPENAI_MODEL,
      messages: [
        { role: "system", content: "You write safe, gentle, private-by-default story session records for a family-facing product. Output strict JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
      store: false
    }),
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Story provider request failed (HTTP ${response.status}).`);
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Story provider returned no content.");

  const parsed = JSON.parse(content) as unknown;
  assertStringRecord(parsed);

  const output = {
    chapterTitle: readString(parsed, "chapterTitle", "Chapter One: The Signal Becomes a Story", 140),
    chapterSummary: readString(parsed, "chapterSummary", "A private moment was shaped into a gentle narrative replay.", 800),
    momentTitle: readString(parsed, "momentTitle", "A moment worth remembering", 140),
    momentBody: readString(parsed, "momentBody", input.sourceText || "A quiet signal became a private story.", 1600),
    narratorText: readString(parsed, "narratorText", "This private moment can be held gently.", 1200),
    scenePrompt: readString(parsed, "scenePrompt", "A private, symbolic memory scene with soft light.", 500),
    visualMood: readString(parsed, "visualMood", input.emotionalTone, 80),
    audioMood: readString(parsed, "audioMood", "warm, slow, spacious", 120),
    arcLabel: readString(parsed, "arcLabel", "gentle return", 80),
    arcSummary: readString(parsed, "arcSummary", "The story moves from signal to meaning, then returns to a calmer frame.", 800),
    peakTone: readString(parsed, "peakTone", "noticed", 80),
    resolutionTone: readString(parsed, "resolutionTone", "settled", 80)
  };

  await moderateWithProvider(apiKey, Object.values(output).join("\n"), "output");
  return output;
}
