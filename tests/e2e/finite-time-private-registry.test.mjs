import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const schemas = fs.readFileSync('src/lib/finite-time/schemas.ts', 'utf8');
const chapter = fs.readFileSync('src/lib/finite-time/farm-to-lake.ts', 'utf8');
const registry = fs.readFileSync('src/lib/finite-time/registry.ts', 'utf8');
const authorization = fs.readFileSync('src/lib/finite-time/final-render-approval.ts', 'utf8');
const functions = fs.readFileSync('functions/src/finite-time-registry.ts', 'utf8');
const functionsIndex = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');

function includesAll(source, values) {
  for (const value of values) assert.ok(source.includes(value), `Missing required contract: ${value}`);
}

test('canon schema preserves uncertainty, opaque evidence and no-final-render boundary', () => {
  includesAll(schemas, [
    'finite-time-canon-registry-v1',
    'family-memory',
    'reconstructed',
    'type-reference',
    'drv_ft_',
    'privacyClass: z.literal("owner-only")',
    'finalRenderingAuthorized: z.literal(false)',
    'Public-safe canon requires approved public release consent.'
  ]);
  assert.doesNotMatch(schemas, /https?:\/\/|google\.com\/maps|drive\.google\.com/);
});

test('Farm-to-Lake graph is complete, timed and redacted for handoff', () => {
  const shotIds = [...chapter.matchAll(/id: "ft-fl-(\d{3})"/g)].map((match) => match[1]);
  assert.equal(shotIds.length, 30);
  assert.deepEqual(shotIds, Array.from({ length: 30 }, (_, index) => String(index + 1).padStart(3, '0')));
  includesAll(chapter, [
    'targetDurationSeconds: 180',
    'canonRevision: FARM_TO_LAKE_CANON_REGISTRY.sourceAuthority.revision',
    'renderMode: "deterministic-local-proof"',
    'finalRenderingAuthorized: false',
    'createRedactedFarmToLakeHandoff',
    'scene-land-before-water',
    'scene-ice-and-cow',
    'scene-family-chaos',
    'scene-digital-door',
    'scene-snake-shoe',
    'scene-ski-nautique',
    'audioDescription',
    'haptics',
    'caption'
  ]);
  assert.doesNotMatch(chapter, /Julie Ashpole|Robert Cohagen|Eloree Clamp|Sally/);
});

test('readiness blocks provider spend and final rendering', () => {
  includesAll(registry, [
    'providerSpendAuthorized: false',
    'finalRenderingAuthorized: false',
    'animaticReady',
    'references unknown canon entry',
    'that is not approved for animatic',
    'deterministic-local-proof'
  ]);
});

test('final render authorization requires signed checksum-locked approvals and nonzero ceilings', () => {
  includesAll(authorization, [
    'finite-time-final-render-authorization-v1',
    'finalRenderingAuthorized: false',
    'absoluteProjectCeilingUsd: 0',
    'perShotCeilingUsd: 0',
    'providers: []',
    'source-commit-not-locked',
    'source-manifest-not-locked',
    'no-provider-model-authorized',
    'absolute-project-ceiling-missing',
    'per-shot-ceiling-missing',
    'final-rendering-not-authorized',
    'provider-training-use-not-prohibited',
    'provider-terms-review-incomplete',
    'provider-call-cost-exceeds-per-shot-ceiling',
    'provider-phase-cost-exceeds-project-ceiling',
    'provider-call-budget-exceeds-phase-ceiling',
    'provider-phase-total-exceeds-project-ceiling',
    'artifact-id-mismatch',
    'source-revision-mismatch',
    'provider-retention-policy-not-approved',
    'provider-retention-manifest-not-bound-to-privacy-approval',
    'fallback-provider-not-authorized',
    'retentionPolicySha256'
  ]);
  assert.doesNotMatch(authorization, /finalRenderingAuthorized:\s*true/);
});

test('private callables and rules are owner scoped and fail closed', () => {
  includesAll(functions, [
    'upsertFiniteTimeCanonRegistry',
    'upsertFiniteTimeShotGraph',
    'getFiniteTimeProductionReadiness',
    'request.auth.uid !== ownerId',
    'finalRenderingAuthorized: false',
    'finiteTimeCanonRegistries',
    'finiteTimeShotGraphs',
    'storedCanonGraphBlockers',
    'Canon revisions are immutable',
    'requireReadiness: false',
    'Shot sceneId must match its parent scene.',
    'references unknown canon entry',
    'A valid private canon registry must exist before its shot graph can be stored.',
    'updatedAt: registry.updatedAt',
    'updatedAt: graph.updatedAt',
    'version: z.number().int().positive()',
    'sequenceId: stableId',
    'audioDescription: z.string().min(1).max(800)',
    'Haptic cue cannot occur after the shot ends.'
  ]);
  assert.doesNotMatch(functions, /FieldValue\.serverTimestamp\(\)/);
  const persistedWrites = [
    functions.match(/transaction\.set\(registryRef, \{[\s\S]*?\}, \{ merge: false \}\);/)?.[0] ?? '',
    functions.match(/\.doc\(id\)\.set\(\{[\s\S]*?\}, \{ merge: false \}\);/)?.[0] ?? ''
  ];
  assert.ok(persistedWrites.every(Boolean), 'both finite-time write payloads must be present');
  for (const payload of persistedWrites) assert.doesNotMatch(payload, /providerSpendAuthorized/);
  includesAll(functionsIndex, [
    'upsertFiniteTimeCanonRegistry',
    'upsertFiniteTimeShotGraph',
    'getFiniteTimeProductionReadiness'
  ]);
  includesAll(rules, [
    'function privateFiniteTimeCreate()',
    "request.resource.data.privacyClass == 'owner-only'",
    'request.resource.data.finalRenderingAuthorized == false',
    'request.resource.data.providerSpendAuthorized == false',
    'match /finiteTimeCanonRegistries/{id}',
    'match /finiteTimeShotGraphs/{id}',
    "allow create, update: if false"
  ]);
  assert.doesNotMatch(rules, /match \/finiteTime(?:CanonRegistries|ShotGraphs)\/\{id\}[\s\S]*allow read: if true/);
});
