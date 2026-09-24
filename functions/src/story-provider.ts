export interface StoryProviderInput {
  title: string;
  sourceText?: string;
  emotionalTone: string;
  symbolicMotifs: string[];
  locale: "en-US";
  audienceAgeBand: "family" | "preschool_3_5" | "early_reader_6_8" | "middle_grade_9_12";
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

export interface StoryProviderReceipt {
  schemaVersion: "storytime-provider-receipt-v1";
  provider: "openai" | "local_builder";
  model: string;
  providerRequestId: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  configuredInputUsdPerMillionTokens: number | null;
  configuredOutputUsdPerMillionTokens: number | null;
  estimatedMaxCostUsd: number;
  actualCostUsd: number;
  maxAllowedCostUsd: number | null;
  attemptCount: 1;
  costStatus: "priced_from_configured_rates" | "no_provider_spend";
}

export interface StoryProviderResult {
  output: StoryProviderOutput;
  receipt: StoryProviderReceipt;
}

const REQUIRED_OPENAI_ENV = ["OPENAI_API_KEY", "STORYTIME_OPENAI_MODEL"];

function positiveNumber(name: string) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function boundedOutputTokens() {
  const configured = Number(process.env.STORYTIME_OPENAI_MAX_OUTPUT_TOKENS || 900);
  if (!Number.isFinite(configured)) return 900;
  return Math.min(2000, Math.max(128, Math.floor(configured)));
}

function providerPricingConfig() {
  return {
    spendAuthorized: process.env.STORYTIME_PROVIDER_SPEND_AUTHORIZED === "true",
    inputUsdPerMillionTokens: positiveNumber("STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS"),
    outputUsdPerMillionTokens: positiveNumber("STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS"),
    maxGenerationCostUsd: positiveNumber("STORYTIME_MAX_GENERATION_COST_USD"),
    maxOutputTokens: boundedOutputTokens()
  };
}

function missingOpenAIEnv() {
  const missing = REQUIRED_OPENAI_ENV.filter((key) => !process.env[key]?.trim());
  const pricing = providerPricingConfig();
  if (!pricing.spendAuthorized) missing.push("STORYTIME_PROVIDER_SPEND_AUTHORIZED=true");
  if (pricing.inputUsdPerMillionTokens === null) missing.push("STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS>0");
  if (pricing.outputUsdPerMillionTokens === null) missing.push("STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS>0");
  if (pricing.maxGenerationCostUsd === null) missing.push("STORYTIME_MAX_GENERATION_COST_USD>0");
  return missing;
}

export function getStoryProviderReadiness() {
  const provider = process.env.STORYTIME_GENERATION_PROVIDER || "disabled";
  const missing = provider === "openai" ? missingOpenAIEnv() : ["STORYTIME_GENERATION_PROVIDER=openai"];
  return {
    provider,
    ready: provider === "openai" && missing.length === 0,
    missing,
    spendAuthorized: provider === "openai" && providerPricingConfig().spendAuthorized
  };
}

function assertStringRecord(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Story provider returned invalid JSON.");
  }
}

const SENSITIVE_OUTPUT_TERMS = [
  "suicide",
  "self-harm",
  "kill yourself",
  "explicit sexual",
  "rape",
  "weapon",
  "diagnosis",
  "clinical depression",
  "bipolar",
  "schizophrenia"
];

function assertProviderOutputSafe(output: StoryProviderOutput) {
  const combined = Object.values(output).join(" ").toLowerCase();
  const hit = SENSITIVE_OUTPUT_TERMS.find((term) => combined.includes(term));
  if (hit) {
    throw new Error("Story provider output requires safety review.");
  }
}

function audienceInstruction(ageBand: StoryProviderInput["audienceAgeBand"]) {
  if (ageBand === "preschool_3_5") return "Audience: ages 3-5. Use very simple language, low emotional intensity, no frightening escalation, and no unsafe advice.";
  if (ageBand === "early_reader_6_8") return "Audience: ages 6-8. Use clear concrete language, gentle stakes, and no frightening escalation or unsafe advice.";
  if (ageBand === "middle_grade_9_12") return "Audience: ages 9-12. Keep language age-appropriate, emotionally grounded, and avoid adult themes or unsafe advice.";
  return "Audience: family/general. Keep the story suitable for shared family reading and avoid adult themes or unsafe advice.";
}

function readString(record: Record<string, unknown>, key: keyof StoryProviderOutput, fallback: string, maxLength: number) {
  const value = record[key];
  return (typeof value === "string" && value.trim() ? value.trim() : fallback).slice(0, maxLength);
}

export async function generateStoryWithProvider(input: StoryProviderInput): Promise<StoryProviderResult> {
  const readiness = getStoryProviderReadiness();
  if (!readiness.ready) {
    throw new Error(`Story provider is not configured. Missing: ${readiness.missing.join(", ")}`);
  }

  const systemPrompt = "You write safe, gentle, private-by-default story session records for a family-facing product. Output strict JSON only.";
  const prompt = [
    "Create a family-safe private reflective Storytime session.",
    "Return JSON only with keys: chapterTitle, chapterSummary, momentTitle, momentBody, narratorText, scenePrompt, visualMood, audioMood, arcLabel, arcSummary, peakTone, resolutionTone.",
    "Do not diagnose, shame, intensify fear, expose private personal details, or create public-share text.",
    audienceInstruction(input.audienceAgeBand),
    `Locale: ${input.locale}. Do not silently translate or switch languages.`,
    `Title: ${input.title}`,
    `Tone: ${input.emotionalTone}`,
    `Motifs: ${input.symbolicMotifs.join(", ") || "soft light"}`,
    `Source: ${input.sourceText || "No source text provided."}`
  ].join("\n");

  const pricing = providerPricingConfig();
  if (
    pricing.inputUsdPerMillionTokens === null
    || pricing.outputUsdPerMillionTokens === null
    || pricing.maxGenerationCostUsd === null
  ) {
    throw new Error("Story provider pricing/budget configuration is incomplete.");
  }

  // UTF-8 bytes are used as a deliberately conservative ceiling for input-token budgeting.
  const conservativeInputTokenCeiling = Buffer.byteLength(`${systemPrompt}\n${prompt}`, "utf8");
  const estimatedMaxCostUsd =
    (conservativeInputTokenCeiling / 1_000_000) * pricing.inputUsdPerMillionTokens
    + (pricing.maxOutputTokens / 1_000_000) * pricing.outputUsdPerMillionTokens;

  if (estimatedMaxCostUsd > pricing.maxGenerationCostUsd) {
    throw new Error("Story provider request exceeds the configured per-request cost ceiling.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.STORYTIME_OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: pricing.maxOutputTokens,
      response_format: { type: "json_object" }
    })
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Story provider request failed with status ${response.status}.`);
  }

  const payload = await response.json() as {
    id?: string;
    model?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Story provider returned no content.");

  const providerRequestId = response.headers.get("x-request-id") || payload.id;
  const promptTokens = payload.usage?.prompt_tokens;
  const completionTokens = payload.usage?.completion_tokens;
  const totalTokens = payload.usage?.total_tokens;
  if (
    !providerRequestId
    || typeof promptTokens !== "number" || !Number.isInteger(promptTokens) || promptTokens < 0
    || typeof completionTokens !== "number" || !Number.isInteger(completionTokens) || completionTokens < 0
    || typeof totalTokens !== "number" || !Number.isInteger(totalTokens) || totalTokens < 0
  ) {
    throw new Error("Story provider usage receipt is incomplete.");
  }

  const actualCostUsd =
    (Number(promptTokens) / 1_000_000) * pricing.inputUsdPerMillionTokens
    + (Number(completionTokens) / 1_000_000) * pricing.outputUsdPerMillionTokens;
  if (actualCostUsd > pricing.maxGenerationCostUsd) {
    throw new Error("Story provider actual cost exceeded the configured per-request ceiling.");
  }

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
  assertProviderOutputSafe(output);
  return {
    output,
    receipt: {
      schemaVersion: "storytime-provider-receipt-v1",
      provider: "openai",
      model: payload.model || process.env.STORYTIME_OPENAI_MODEL!,
      providerRequestId,
      promptTokens: Number(promptTokens),
      completionTokens: Number(completionTokens),
      totalTokens: Number(totalTokens),
      configuredInputUsdPerMillionTokens: pricing.inputUsdPerMillionTokens,
      configuredOutputUsdPerMillionTokens: pricing.outputUsdPerMillionTokens,
      estimatedMaxCostUsd,
      actualCostUsd,
      maxAllowedCostUsd: pricing.maxGenerationCostUsd,
      attemptCount: 1,
      costStatus: "priced_from_configured_rates"
    }
  };
}
