import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const schemas = fs.readFileSync('src/lib/finite-time/schemas.ts', 'utf8');
const chapter = fs.readFileSync('src/lib/finite-time/farm-to-lake.ts', 'utf8');
const registry = fs.readFileSync('src/lib/finite-time/registry.ts', 'utf8');
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
    'deterministic-local-proof'
  ]);
});

test('private callables and rules are owner scoped and fail closed', () => {
  includesAll(functions, [
    'upsertFiniteTimeCanonRegistry',
    'upsertFiniteTimeShotGraph',
    'getFiniteTimeProductionReadiness',
    'request.auth.uid !== ownerId',
    'providerSpendAuthorized: false',
    'finalRenderingAuthorized: false',
    'finiteTimeCanonRegistries',
    'finiteTimeShotGraphs'
  ]);
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
    "request.resource.data.renderMode == 'deterministic-local-proof'"
  ]);
  assert.doesNotMatch(rules, /match \/finiteTime(?:CanonRegistries|ShotGraphs)\/\{id\}[\s\S]*allow read: if true/);
});
