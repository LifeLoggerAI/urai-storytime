import { z } from "zod";

export const StorytimeNarratorDeliverySchema = z.object({
  schemaVersion: z.literal("urai-authenticated-private-media-v1"),
  requiresAuthorization: z.literal(true), action: z.literal("deliver"), kind: z.literal("audio"),
  authorityHash: z.string().regex(/^[0-9a-f]{64}$/), expiresAt: z.number().finite().int().positive(),
  generation: z.string().regex(/^[0-9]+$/),
  jobId: z.string().min(1).max(300).regex(/^[^/]+$/),
  sessionId: z.string().min(1).max(300).regex(/^[^/]+$/),
  narratorScriptId: z.string().min(1).max(300).regex(/^[^/]+$/)
}).strict();
