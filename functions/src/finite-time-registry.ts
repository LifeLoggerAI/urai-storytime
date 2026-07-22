import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";

if (getApps().length === 0) initializeApp();

const stableId = z.string().min(3).max(96).regex(/^[a-z0-9][a-z0-9-]*$/);
const privateDocument = z.object({
  projectId: stableId,
  ownerId: z.string().min(1).max(128),
  privacyClass: z.literal("owner-only"),
  finalRenderingAuthorized: z.literal(false)
}).passthrough();

const canonRegistrySchema = privateDocument.extend({
  schemaVersion: z.literal("finite-time-canon-registry-v1"),
  entries: z.array(z.object({
    id: stableId,
    projectId: stableId,
    ownerId: z.string().min(1).max(128),
    privacyClass: z.literal("owner-only"),
    truthClass: z.enum(["exact", "approximate", "family-memory", "reconstructed", "disputed", "private", "pending"]),
    evidenceRefs: z.array(z.object({
      id: z.string().regex(/^drv_ft_[a-z0-9_]{6,96}$/),
      access: z.enum(["owner-only", "approved-reviewers"])
    }).passthrough())
  }).passthrough()).min(1)
}).superRefine((registry, context) => {
  registry.entries.forEach((entry, index) => {
    if (entry.projectId !== registry.projectId || entry.ownerId !== registry.ownerId) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["entries", index], message: "Entry authority mismatch." });
    }
  });
});

const shotGraphSchema = privateDocument.extend({
  schemaVersion: z.literal("finite-time-shot-graph-v1"),
  chapterId: stableId,
  renderMode: z.literal("deterministic-local-proof"),
  targetDurationSeconds: z.number().positive(),
  scenes: z.array(z.object({
    id: stableId,
    shots: z.array(z.object({
      id: stableId,
      sceneId: stableId,
      durationSeconds: z.number().positive(),
      renderMethod: z.literal("deterministic-local-proof"),
      reviewState: z.literal("approved-for-animatic"),
      canonEntryIds: z.array(stableId).min(1)
    }).passthrough()).min(1)
  }).passthrough()).min(1)
}).superRefine((graph, context) => {
  const duration = graph.scenes.flatMap((scene) => scene.shots).reduce((sum, shot) => sum + shot.durationSeconds, 0);
  if (Math.abs(duration - graph.targetDurationSeconds) > 0.001) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["targetDurationSeconds"], message: "Shot duration total mismatch." });
  }
});

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
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  return { registryId: id, privateByDefault: true, finalRenderingAuthorized: false };
});

export const upsertFiniteTimeShotGraph = onCall(async (request) => {
  const parsed = shotGraphSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Invalid FINITE TIME shot graph.");
  const graph = parsed.data;
  const ownerId = requireOwner(request, graph.ownerId);
  const id = `${graph.projectId}-${graph.chapterId}-${ownerId}`;
  await getFirestore().collection("finiteTimeShotGraphs").doc(id).set({
    ...graph,
    ownerId,
    providerSpendAuthorized: false,
    finalRenderingAuthorized: false,
    updatedAt: FieldValue.serverTimestamp()
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
  if (canonData?.privacyClass !== "owner-only" || graphData?.privacyClass !== "owner-only") blockers.push("Private boundary is not intact.");
  if (canonData?.finalRenderingAuthorized !== false || graphData?.finalRenderingAuthorized !== false) blockers.push("Final rendering authorization must remain false.");
  if (graphData?.renderMode !== "deterministic-local-proof") blockers.push("Shot graph is not deterministic local proof mode.");
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
