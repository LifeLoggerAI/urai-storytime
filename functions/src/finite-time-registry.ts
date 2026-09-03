import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";

if (getApps().length === 0) initializeApp();

const stableId = z.string().min(3).max(96).regex(/^[a-z0-9][a-z0-9-]*$/);
const isoDate = z.string().datetime({ offset: true });
const truthClass = z.enum(["exact", "approximate", "family-memory", "reconstructed", "disputed", "private", "pending"]);
const privacyClass = z.enum(["owner-only", "approved-reviewers", "redacted-handoff", "public-safe"]);
const rightsState = z.enum(["owner-controlled", "permission-pending", "approved", "anonymize", "exclude", "not-applicable"]);
const privateDocument = z.object({
  projectId: stableId,
  ownerId: z.string().min(1).max(128),
  privacyClass: z.literal("owner-only"),
  finalRenderingAuthorized: z.literal(false)
}).passthrough();

const canonRegistrySchema = privateDocument.extend({
  schemaVersion: z.literal("finite-time-canon-registry-v1"),
  title: z.string().min(1).max(160),
  sourceAuthority: z.object({
    type: z.literal("private-drive"),
    documentId: z.string().regex(/^drv_ft_[a-z0-9_]{6,96}$/),
    revision: z.string().min(1).max(80)
  }).strict(),
  createdAt: isoDate,
  updatedAt: isoDate,
  entries: z.array(z.object({
    id: stableId,
    projectId: stableId,
    version: z.number().int().positive(),
    ownerId: z.string().min(1).max(128),
    kind: z.enum(["event", "person-role", "animal", "location", "vehicle", "prop", "technology", "theme", "sound-memory"]),
    title: z.string().min(1).max(160),
    summary: z.string().min(1).max(1200),
    privacyClass,
    truthClass,
    rightsState,
    chronology: z.object({
      era: z.string().min(1).max(80),
      year: z.number().int().min(1900).max(2100).optional(),
      ageMin: z.number().int().min(0).max(120).optional(),
      ageMax: z.number().int().min(0).max(120).optional(),
      uncertaintyNote: z.string().max(300).optional()
    }).strict(),
    participantRoleIds: z.array(stableId).max(24),
    evidenceRefs: z.array(z.object({
      id: z.string().regex(/^drv_ft_[a-z0-9_]{6,96}$/),
      kind: z.enum(["photo", "map", "record", "firsthand-memory", "family-memory", "type-reference", "audio", "video", "document"]),
      truthClass: z.enum(["exact", "approximate", "family-memory", "reconstructed", "disputed", "private", "pending", "type-reference"]),
      access: z.enum(["owner-only", "approved-reviewers"]),
      contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional()
    }).strict()).max(32),
    consent: z.object({
      autobiographicalUse: z.boolean(),
      likenessUse: z.enum(["not-required", "pending", "approved", "stylize", "exclude"]),
      voiceUse: z.enum(["not-required", "pending", "approved", "exclude"]),
      publicRelease: z.enum(["blocked", "pending", "approved"]),
      capturedAt: isoDate,
      authority: z.enum(["founder", "participant", "rights-counsel", "system-default"])
    }).strict(),
    dignity: z.object({
      sensitiveTopics: z.array(z.enum([
        "none", "grief", "suicide-loss", "combat", "medical", "disability", "addiction",
        "incarceration", "homelessness", "aging", "dementia"
      ])),
      depiction: z.enum(["ordinary", "restrained", "impressionistic", "off-screen", "exclude"]),
      guardrails: z.array(z.string().min(1).max(240)).max(12)
    }).strict(),
    tags: z.array(stableId).max(24),
    reviewState: z.enum(["draft", "needs-founder-review", "approved-for-animatic", "approved-for-final-render", "rejected", "archived"]),
    createdAt: isoDate,
    updatedAt: isoDate
  }).strict().superRefine((entry, context) => {
    if (entry.chronology.ageMin !== undefined && entry.chronology.ageMax !== undefined && entry.chronology.ageMin > entry.chronology.ageMax) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["chronology", "ageMin"], message: "ageMin cannot exceed ageMax." });
    }
    if (entry.privacyClass === "public-safe" && entry.consent.publicRelease !== "approved") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["consent", "publicRelease"], message: "Public-safe canon requires approved public release consent." });
    }
  })).min(1)
}).superRefine((registry, context) => {
  const entryIds = new Set<string>();
  registry.entries.forEach((entry, index) => {
    if (entry.projectId !== registry.projectId || entry.ownerId !== registry.ownerId) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["entries", index], message: "Entry authority mismatch." });
    }
    if (entryIds.has(entry.id)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["entries", index, "id"], message: "Duplicate canon entry ID." });
    }
    entryIds.add(entry.id);
  });
});

const shotGraphSchema = privateDocument.extend({
  schemaVersion: z.literal("finite-time-shot-graph-v1"),
  chapterId: stableId,
  version: z.number().int().positive(),
  title: z.string().min(1).max(160),
  canonRevision: z.string().min(1).max(80),
  renderMode: z.literal("deterministic-local-proof"),
  targetDurationSeconds: z.number().positive(),
  sequences: z.array(z.object({
    id: stableId,
    order: z.number().int().positive(),
    title: z.string().min(1).max(160)
  }).strict()).min(1),
  scenes: z.array(z.object({
    id: stableId,
    sequenceId: stableId,
    order: z.number().int().positive(),
    title: z.string().min(1).max(160),
    purpose: z.string().min(1).max(800),
    emotionalArc: z.object({
      enter: z.string().min(1).max(80),
      turn: z.string().min(1).max(80),
      exit: z.string().min(1).max(80)
    }).strict(),
    shots: z.array(z.object({
      id: stableId,
      sceneId: stableId,
      order: z.number().int().positive(),
      durationSeconds: z.number().positive().max(90),
      title: z.string().min(1).max(160),
      visual: z.string().min(1).max(1000),
      camera: z.object({
        framing: z.enum(["extreme-wide", "wide", "medium", "close", "extreme-close", "pov", "aerial"]),
        movement: z.enum(["locked", "push", "pull", "pan", "tilt", "track", "orbit", "handheld", "crane"]),
        lensMm: z.number().int().min(14).max(200)
      }).strict(),
      narration: z.string().max(1200),
      dialogue: z.array(z.object({ speakerRoleId: stableId, line: z.string().min(1).max(500) }).strict()),
      canonEntryIds: z.array(stableId).min(1).max(24),
      characterRoleIds: z.array(stableId).max(16),
      locationId: stableId,
      propIds: z.array(stableId).max(20),
      musicCueId: stableId,
      foley: z.array(z.string().min(1).max(160)).max(20),
      caption: z.string().max(1200),
      audioDescription: z.string().min(1).max(800),
      haptics: z.array(z.object({
        atSeconds: z.number().min(0),
        pattern: z.enum(["soft-pulse", "double-pulse", "rising", "impact", "texture", "none"]),
        intensity: z.number().min(0).max(1)
      }).strict()),
      truthClass,
      rightsState,
      privacyClass,
      renderMethod: z.literal("deterministic-local-proof"),
      reviewState: z.enum(["draft", "approved-for-animatic", "rejected"])
    }).strict().superRefine((shot, context) => {
      shot.haptics.forEach((cue, index) => {
        if (cue.atSeconds > shot.durationSeconds) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ["haptics", index, "atSeconds"], message: "Haptic cue cannot occur after the shot ends." });
        }
      });
    })).min(1)
  }).strict()).min(1),
  createdAt: isoDate,
  updatedAt: isoDate
}).superRefine((graph, context) => {
  const sequenceIds = new Set<string>();
  graph.sequences.forEach((sequence, sequenceIndex) => {
    if (sequenceIds.has(sequence.id)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["sequences", sequenceIndex, "id"], message: "Duplicate sequence ID." });
    }
    sequenceIds.add(sequence.id);
  });
  const sceneIds = new Set<string>();
  const shotIds = new Set<string>();
  graph.scenes.forEach((scene, sceneIndex) => {
    if (!sequenceIds.has(scene.sequenceId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["scenes", sceneIndex, "sequenceId"], message: "Scene references an unknown sequence ID." });
    }
    if (sceneIds.has(scene.id)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["scenes", sceneIndex, "id"], message: "Duplicate scene ID." });
    }
    sceneIds.add(scene.id);
    scene.shots.forEach((shot, shotIndex) => {
      if (shot.sceneId !== scene.id) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["scenes", sceneIndex, "shots", shotIndex, "sceneId"], message: "Shot sceneId must match its parent scene." });
      }
      if (shotIds.has(shot.id)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["scenes", sceneIndex, "shots", shotIndex, "id"], message: "Duplicate shot ID." });
      }
      shotIds.add(shot.id);
    });
  });
  const duration = graph.scenes.flatMap((scene) => scene.shots).reduce((sum, shot) => sum + shot.durationSeconds, 0);
  if (Math.abs(duration - graph.targetDurationSeconds) > 0.001) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["targetDurationSeconds"], message: "Shot duration total mismatch." });
  }
});

function storedCanonGraphBlockers(canonValue: unknown, graphValue: unknown) {
  const canon = canonRegistrySchema.safeParse(canonValue);
  const graph = shotGraphSchema.safeParse(graphValue);
  const blockers: string[] = [];
  if (!canon.success) blockers.push("Stored canon registry failed schema validation.");
  if (!graph.success) blockers.push("Stored shot graph failed schema validation.");
  if (!canon.success || !graph.success) return blockers;

  if (canon.data.projectId !== graph.data.projectId || canon.data.ownerId !== graph.data.ownerId) {
    blockers.push("Stored canon and shot graph authority do not match.");
  }
  if (canon.data.sourceAuthority.revision !== graph.data.canonRevision) {
    blockers.push("Stored shot graph does not match the exact canon revision.");
  }
  const canonEntryIds = new Set(canon.data.entries.map((entry) => entry.id));
  for (const scene of graph.data.scenes) {
    for (const shot of scene.shots) {
      if (shot.reviewState !== "approved-for-animatic") {
        blockers.push(`Shot ${shot.id} is not approved for animatic.`);
      }
      for (const canonEntryId of shot.canonEntryIds) {
        if (!canonEntryIds.has(canonEntryId)) {
          blockers.push(`Shot ${shot.id} references unknown canon entry ${canonEntryId}.`);
        }
      }
    }
  }
  return [...new Set(blockers)];
}

function requireOwner(request: { auth?: { uid: string } | null }, ownerId: string) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (request.auth.uid !== ownerId) throw new HttpsError("permission-denied", "Owner authority is required.");
  return request.auth.uid;
}

export const upsertFiniteTimeCanonRegistry = onCall(async (request) => {
  const parsed = canonRegistrySchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Invalid private FINITE TIME canon registry.");
  const registry = parsed.data;
  const ownerId = requireOwner(request, registry.ownerId);
  const id = `${registry.projectId}-${ownerId}`;
  await getFirestore().collection("finiteTimeCanonRegistries").doc(id).set({
    ...registry,
    ownerId,
    providerSpendAuthorized: false,
    finalRenderingAuthorized: false,
    updatedAt: registry.updatedAt
  }, { merge: true });
  return { registryId: id, privateByDefault: true, finalRenderingAuthorized: false };
});

export const upsertFiniteTimeShotGraph = onCall(async (request) => {
  const parsed = shotGraphSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Invalid FINITE TIME shot graph.");
  const graph = parsed.data;
  const ownerId = requireOwner(request, graph.ownerId);
  const db = getFirestore();
  const canon = await db.collection("finiteTimeCanonRegistries").doc(`${graph.projectId}-${ownerId}`).get();
  if (!canon.exists) {
    throw new HttpsError("failed-precondition", "A valid private canon registry must exist before its shot graph can be stored.");
  }
  const consistencyBlockers = storedCanonGraphBlockers(canon.data(), graph);
  if (consistencyBlockers.length > 0) {
    throw new HttpsError("failed-precondition", `Shot graph is incompatible with the stored canon registry: ${consistencyBlockers.join(" ")}`);
  }
  const id = `${graph.projectId}-${graph.chapterId}-${ownerId}`;
  await db.collection("finiteTimeShotGraphs").doc(id).set({
    ...graph,
    ownerId,
    providerSpendAuthorized: false,
    finalRenderingAuthorized: false,
    updatedAt: graph.updatedAt
  }, { merge: true });
  return { shotGraphId: id, animaticOnly: true, finalRenderingAuthorized: false };
});

export const getFiniteTimeProductionReadiness = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  const input = z.object({ projectId: stableId, chapterId: stableId }).safeParse(request.data);
  if (!input.success) throw new HttpsError("invalid-argument", "projectId and chapterId are required.");
  const ownerId = request.auth.uid;
  const db = getFirestore();
  const [canon, graph] = await Promise.all([
    db.collection("finiteTimeCanonRegistries").doc(`${input.data.projectId}-${ownerId}`).get(),
    db.collection("finiteTimeShotGraphs").doc(`${input.data.projectId}-${input.data.chapterId}-${ownerId}`).get()
  ]);
  const canonData = canon.data();
  const graphData = graph.data();
  const blockers: string[] = [];
  if (!canon.exists) blockers.push("Private canon registry is missing.");
  if (!graph.exists) blockers.push("Shot graph is missing.");
  if (canon.exists && graph.exists) blockers.push(...storedCanonGraphBlockers(canonData, graphData));
  return {
    projectId: input.data.projectId,
    chapterId: input.data.chapterId,
    canonPresent: canon.exists,
    shotGraphPresent: graph.exists,
    animaticReady: blockers.length === 0,
    providerSpendAuthorized: false,
    finalRenderingAuthorized: false,
    blockers
  };
});
