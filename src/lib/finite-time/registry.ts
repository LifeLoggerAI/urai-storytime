import {
  FiniteTimeCanonRegistrySchema,
  FiniteTimeShotGraphSchema,
  type FiniteTimeCanonRegistry,
  type FiniteTimeShotGraph
} from "./schemas";
import {
  FARM_TO_LAKE_CANON_REGISTRY,
  FARM_TO_LAKE_SHOT_GRAPH,
  createRedactedFarmToLakeHandoff
} from "./farm-to-lake";

export type FiniteTimeReadiness = {
  canonValid: boolean;
  shotGraphValid: boolean;
  privateByDefault: boolean;
  providerSpendAuthorized: false;
  finalRenderingAuthorized: false;
  sceneCount: number;
  shotCount: number;
  durationSeconds: number;
  blockers: string[];
  animaticReady: boolean;
};

export function validateFiniteTimeCanon(value: unknown): FiniteTimeCanonRegistry {
  return FiniteTimeCanonRegistrySchema.parse(value);
}

export function validateFiniteTimeShotGraph(value: unknown): FiniteTimeShotGraph {
  return FiniteTimeShotGraphSchema.parse(value);
}

export function evaluateFiniteTimeReadiness(
  canon: FiniteTimeCanonRegistry = FARM_TO_LAKE_CANON_REGISTRY,
  graph: FiniteTimeShotGraph = FARM_TO_LAKE_SHOT_GRAPH
): FiniteTimeReadiness {
  const canonValid = FiniteTimeCanonRegistrySchema.safeParse(canon).success;
  const shotGraphValid = FiniteTimeShotGraphSchema.safeParse(graph).success;
  const shots = graph.scenes.flatMap((scene) => scene.shots);
  const canonIds = new Set(canon.entries.map((entry) => entry.id));
  const blockers: string[] = [];

  if (!canonValid) blockers.push("Canon registry failed schema validation.");
  if (!shotGraphValid) blockers.push("Shot graph failed schema validation.");
  if (canon.ownerId !== graph.ownerId || canon.projectId !== graph.projectId) blockers.push("Canon and shot graph authority do not match.");
  if (canon.privacyClass !== "owner-only" || graph.privacyClass !== "owner-only") blockers.push("Private-by-default boundary is not intact.");
  if (canon.finalRenderingAuthorized || graph.finalRenderingAuthorized) blockers.push("Final rendering must remain unauthorized during animatic production.");

  for (const shot of shots) {
    for (const id of shot.canonEntryIds) {
      if (!canonIds.has(id)) blockers.push(`Shot ${shot.id} references unknown canon entry ${id}.`);
    }
    if (shot.renderMethod !== "deterministic-local-proof") blockers.push(`Shot ${shot.id} is not a local-proof render.`);
    if (shot.reviewState !== "approved-for-animatic") blockers.push(`Shot ${shot.id} is not approved for animatic.`);
  }

  return {
    canonValid,
    shotGraphValid,
    privateByDefault: canon.privacyClass === "owner-only" && graph.privacyClass === "owner-only",
    providerSpendAuthorized: false,
    finalRenderingAuthorized: false,
    sceneCount: graph.scenes.length,
    shotCount: shots.length,
    durationSeconds: shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
    blockers: [...new Set(blockers)],
    animaticReady: blockers.length === 0
  };
}

export function getFarmToLakePrivateRegistry() {
  return {
    canon: FARM_TO_LAKE_CANON_REGISTRY,
    shotGraph: FARM_TO_LAKE_SHOT_GRAPH,
    readiness: evaluateFiniteTimeReadiness()
  };
}

export function getFarmToLakeRedactedHandoff() {
  const readiness = evaluateFiniteTimeReadiness();
  if (!readiness.animaticReady) {
    throw new Error(`Farm-to-Lake handoff blocked: ${readiness.blockers.join(" ")}`);
  }
  return {
    ...createRedactedFarmToLakeHandoff(),
    readiness,
    providerSpendAuthorized: false,
    finalRenderingAuthorized: false
  };
}
