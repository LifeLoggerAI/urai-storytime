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

const REQUIRED_OPENAI_ENV = ["OPENAI_API_KEY", "STORYTIME_OPENAI_MODEL"];

function missingOpenAIEnv() {
  return REQUIRED_OPENAI_ENV.filter((key) => !process.env[key]?.trim());
}

export function getStoryProviderReadiness() {
  const provider = process.env.STORYTIME_GENERATION_PROVIDER || "disabled";
  const missing = provider === "openai" ? missingOpenAIEnv() : ["STORYTIME_GENERATION_PROVIDER=openai"];
  return {
    provider,
    ready: provider === "openai" && missing.length === 0,
    missing
  };
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

export async function generateStoryWithProvider(input: StoryProviderInput): Promise<StoryProviderOutput> {
  const readiness = getStoryProviderReadiness();
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

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.STORYTIME_OPENAI_MODEL,
      messages: [
        { role: "system", content: "You write safe, gentle, private-by-default story session records for a family-facing product. Output strict JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Story provider request failed: ${response.status} ${errorText.slice(0, 300)}`);
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Story provider returned no content.");

  const parsed = JSON.parse(content) as unknown;
  assertStringRecord(parsed);

  return {
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
}
