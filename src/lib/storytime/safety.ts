import { z } from "zod";

const blockedTerms = [
  "suicide",
  "self-harm",
  "kill",
  "blood",
  "weapon",
  "explicit",
  "nude",
  "abuse",
  "diagnosis",
  "clinical depression",
  "bipolar",
  "schizophrenia",
  "ptsd"
];

export const StoryInputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(120),
  sourceText: z.string().max(12000).optional(),
  emotionalTone: z.string().max(80).optional(),
  symbolicMotifs: z.array(z.string().max(60)).max(12).default([]),
  useMemories: z.boolean().default(false),
  allowPublicSharing: z.boolean().default(false)
});

export function moderateStoryText(input: string): {
  safe: boolean;
  status: "approved" | "blocked" | "needs_review";
  reasons: string[];
} {
  const text = input.toLowerCase();
  const hits = blockedTerms.filter((term) => text.includes(term));

  if (hits.length > 0) {
    return {
      safe: false,
      status: "needs_review",
      reasons: hits.map((hit) => `Contains sensitive term: ${hit}`)
    };
  }

  return { safe: true, status: "approved", reasons: [] };
}

export function assertPublicShareAllowed(input: { consent: boolean; text: string }): void {
  if (!input.consent) {
    throw new Error("Public sharing requires explicit user consent.");
  }

  const result = moderateStoryText(input.text);
  if (!result.safe) {
    throw new Error("Public share blocked until sensitive content is reviewed or redacted.");
  }
}
