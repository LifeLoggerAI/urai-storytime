import { z } from "zod";

const StableIdSchema = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "IDs must be lowercase kebab-case.");

const IsoDateSchema = z.string().datetime({ offset: true });

export const FiniteTimeTruthClassSchema = z.enum([
  "exact",
  "approximate",
  "family-memory",
  "reconstructed",
  "disputed",
  "private",
  "pending"
]);

export const FiniteTimePrivacyClassSchema = z.enum([
  "owner-only",
  "approved-reviewers",
  "redacted-handoff",
  "public-safe"
]);

export const FiniteTimeRightsStateSchema = z.enum([
  "owner-controlled",
  "permission-pending",
  "approved",
  "anonymize",
  "exclude",
  "not-applicable"
]);

export const FiniteTimeReviewStateSchema = z.enum([
  "draft",
  "needs-founder-review",
  "approved-for-animatic",
  "approved-for-final-render",
  "rejected",
  "archived"
]);

export const OpaqueEvidenceRefSchema = z
  .object({
    id: z.string().regex(/^drv_ft_[a-z0-9_]{6,96}$/),
    kind: z.enum([
      "photo",
      "map",
      "record",
      "firsthand-memory",
      "family-memory",
      "type-reference",
      "audio",
      "video",
      "document"
    ]),
    truthClass: FiniteTimeTruthClassSchema,
    access: z.enum(["owner-only", "approved-reviewers"]),
    contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional()
  })
  .strict();

export const FiniteTimeConsentSnapshotSchema = z
  .object({
    autobiographicalUse: z.boolean(),
    likenessUse: z.enum(["not-required", "pending", "approved", "stylize", "exclude"]),
    voiceUse: z.enum(["not-required", "pending", "approved", "exclude"]),
    publicRelease: z.enum(["blocked", "pending", "approved"]),
    capturedAt: IsoDateSchema,
    authority: z.enum(["founder", "participant", "rights-counsel", "system-default"])
  })
  .strict();

export const FiniteTimeDignitySchema = z
  .object({
    sensitiveTopics: z.array(
      z.enum([
        "none",
        "grief",
        "suicide-loss",
        "combat",
        "medical",
        "disability",
        "addiction",
        "incarceration",
        "homelessness",
        "aging",
        "dementia"
      ])
    ),
    depiction: z.enum(["ordinary", "restrained", "impressionistic", "off-screen", "exclude"]),
    guardrails: z.array(z.string().min(1).max(240)).max(12)
  })
  .strict();

export const FiniteTimeCanonEntrySchema = z
  .object({
    id: StableIdSchema,
    projectId: StableIdSchema,
    version: z.number().int().positive(),
    ownerId: z.string().min(1).max(128),
    kind: z.enum([
      "event",
      "person-role",
      "animal",
      "location",
      "vehicle",
      "prop",
      "technology",
      "theme",
      "sound-memory"
    ]),
    title: z.string().min(1).max(160),
    summary: z.string().min(1).max(1200),
    truthClass: FiniteTimeTruthClassSchema,
    privacyClass: FiniteTimePrivacyClassSchema,
    rightsState: FiniteTimeRightsStateSchema,
    chronology: z
      .object({
        era: z.string().min(1).max(80),
        year: z.number().int().min(1900).max(2100).optional(),
        ageMin: z.number().int().min(0).max(120).optional(),
        ageMax: z.number().int().min(0).max(120).optional(),
        uncertaintyNote: z.string().max(300).optional()
      })
      .strict(),
    participantRoleIds: z.array(StableIdSchema).max(24),
    evidenceRefs: z.array(OpaqueEvidenceRefSchema).max(32),
    consent: FiniteTimeConsentSnapshotSchema,
    dignity: FiniteTimeDignitySchema,
    tags: z.array(StableIdSchema).max(24),
    reviewState: FiniteTimeReviewStateSchema,
    createdAt: IsoDateSchema,
    updatedAt: IsoDateSchema
  })
  .strict()
  .superRefine((entry, context) => {
    if (
      entry.chronology.ageMin !== undefined &&
      entry.chronology.ageMax !== undefined &&
      entry.chronology.ageMin > entry.chronology.ageMax
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["chronology", "ageMin"],
        message: "ageMin cannot exceed ageMax."
      });
    }

    if (entry.privacyClass === "public-safe" && entry.consent.publicRelease !== "approved") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consent", "publicRelease"],
        message: "Public-safe canon requires approved public release consent."
      });
    }
  });

export const FiniteTimeCanonRegistrySchema = z
  .object({
    schemaVersion: z.literal("finite-time-canon-registry-v1"),
    projectId: StableIdSchema,
    ownerId: z.string().min(1).max(128),
    title: z.string().min(1).max(160),
    privacyClass: z.literal("owner-only"),
    sourceAuthority: z.object({
      type: z.literal("private-drive"),
      documentId: z.string().regex(/^drv_ft_[a-z0-9_]{6,96}$/),
      revision: z.string().min(1).max(80)
    }),
    finalRenderingAuthorized: z.literal(false),
    entries: z.array(FiniteTimeCanonEntrySchema).min(1),
    createdAt: IsoDateSchema,
    updatedAt: IsoDateSchema
  })
  .strict()
  .superRefine((registry, context) => {
    const ids = new Set<string>();
    for (const [index, entry] of registry.entries.entries()) {
      if (entry.projectId !== registry.projectId || entry.ownerId !== registry.ownerId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entries", index],
          message: "Entry projectId and ownerId must match the registry."
        });
      }
      if (ids.has(entry.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entries", index, "id"],
          message: `Duplicate canon entry ID: ${entry.id}`
        });
      }
      ids.add(entry.id);
    }
  });

export const FiniteTimeShotSchema = z
  .object({
    id: StableIdSchema,
    sceneId: StableIdSchema,
    order: z.number().int().positive(),
    durationSeconds: z.number().positive().max(90),
    title: z.string().min(1).max(160),
    visual: z.string().min(1).max(1000),
    camera: z
      .object({
        framing: z.enum(["extreme-wide", "wide", "medium", "close", "extreme-close", "pov", "aerial"]),
        movement: z.enum(["locked", "push", "pull", "pan", "tilt", "track", "orbit", "handheld", "crane"]),
        lensMm: z.number().int().min(14).max(200)
      })
      .strict(),
    narration: z.string().max(1200),
    dialogue: z.array(z.object({ speakerRoleId: StableIdSchema, line: z.string().min(1).max(500) }).strict()),
    canonEntryIds: z.array(StableIdSchema).min(1).max(24),
    characterRoleIds: z.array(StableIdSchema).max(16),
    locationId: StableIdSchema,
    propIds: z.array(StableIdSchema).max(20),
    musicCueId: StableIdSchema,
    foley: z.array(z.string().min(1).max(160)).max(20),
    caption: z.string().max(1200),
    audioDescription: z.string().min(1).max(800),
    haptics: z.array(
      z.object({
        atSeconds: z.number().min(0),
        pattern: z.enum(["soft-pulse", "double-pulse", "rising", "impact", "texture", "none"]),
        intensity: z.number().min(0).max(1)
      }).strict()
    ),
    truthClass: FiniteTimeTruthClassSchema,
    rightsState: FiniteTimeRightsStateSchema,
    privacyClass: FiniteTimePrivacyClassSchema,
    renderMethod: z.literal("deterministic-local-proof"),
    reviewState: z.enum(["draft", "approved-for-animatic", "rejected"])
  })
  .strict()
  .superRefine((shot, context) => {
    for (const [index, cue] of shot.haptics.entries()) {
      if (cue.atSeconds > shot.durationSeconds) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["haptics", index, "atSeconds"],
          message: "Haptic cue cannot occur after the shot ends."
        });
      }
    }
  });

export const FiniteTimeSceneSchema = z
  .object({
    id: StableIdSchema,
    sequenceId: StableIdSchema,
    order: z.number().int().positive(),
    title: z.string().min(1).max(160),
    purpose: z.string().min(1).max(800),
    emotionalArc: z.object({
      enter: z.string().min(1).max(80),
      turn: z.string().min(1).max(80),
      exit: z.string().min(1).max(80)
    }).strict(),
    shots: z.array(FiniteTimeShotSchema).min(1)
  })
  .strict();

export const FiniteTimeShotGraphSchema = z
  .object({
    schemaVersion: z.literal("finite-time-shot-graph-v1"),
    projectId: StableIdSchema,
    chapterId: StableIdSchema,
    version: z.number().int().positive(),
    ownerId: z.string().min(1).max(128),
    title: z.string().min(1).max(160),
    privacyClass: z.literal("owner-only"),
    renderMode: z.literal("deterministic-local-proof"),
    finalRenderingAuthorized: z.literal(false),
    targetDurationSeconds: z.number().positive(),
    sequences: z.array(z.object({ id: StableIdSchema, order: z.number().int().positive(), title: z.string().min(1).max(160) }).strict()).min(1),
    scenes: z.array(FiniteTimeSceneSchema).min(1),
    createdAt: IsoDateSchema,
    updatedAt: IsoDateSchema
  })
  .strict()
  .superRefine((graph, context) => {
    const sceneIds = new Set<string>();
    const shotIds = new Set<string>();
    const sequenceIds = new Set(graph.sequences.map((sequence) => sequence.id));
    let duration = 0;

    for (const [sceneIndex, scene] of graph.scenes.entries()) {
      if (!sequenceIds.has(scene.sequenceId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scenes", sceneIndex, "sequenceId"],
          message: `Unknown sequence ID: ${scene.sequenceId}`
        });
      }
      if (sceneIds.has(scene.id)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["scenes", sceneIndex, "id"], message: `Duplicate scene ID: ${scene.id}` });
      }
      sceneIds.add(scene.id);

      for (const [shotIndex, shot] of scene.shots.entries()) {
        duration += shot.durationSeconds;
        if (shot.sceneId !== scene.id) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ["scenes", sceneIndex, "shots", shotIndex, "sceneId"], message: "Shot sceneId must match its parent scene." });
        }
        if (shotIds.has(shot.id)) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ["scenes", sceneIndex, "shots", shotIndex, "id"], message: `Duplicate shot ID: ${shot.id}` });
        }
        shotIds.add(shot.id);
      }
    }

    if (Math.abs(duration - graph.targetDurationSeconds) > 0.001) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetDurationSeconds"],
        message: `Target duration ${graph.targetDurationSeconds} does not match shot total ${duration}.`
      });
    }
  });

export type FiniteTimeCanonRegistry = z.infer<typeof FiniteTimeCanonRegistrySchema>;
export type FiniteTimeCanonEntry = z.infer<typeof FiniteTimeCanonEntrySchema>;
export type FiniteTimeShotGraph = z.infer<typeof FiniteTimeShotGraphSchema>;
export type FiniteTimeShot = z.infer<typeof FiniteTimeShotSchema>;
