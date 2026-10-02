import test from 'node:test';
import assert from 'node:assert/strict';
import { LIFE_MOVIE_TRUTH_CLASSES, buildLifeMovieStoryGraph, normalizeLifeMovieStoryNode } from '../../src/life-movie-story-graph.mjs';

test('life-movie story graph preserves explicit truth classes', () => {
  assert.deepEqual(LIFE_MOVIE_TRUTH_CLASSES, [
    'RECORDED_SOURCE_TRUTH',
    'ATTRIBUTED_FAMILY_RECOLLECTION',
    'SPATIALLY_RECONSTRUCTABLE',
    'INTERPRETIVE_CINEMATIC_RECREATION',
    'UNKNOWN_UNRESOLVED',
  ]);
});

test('life-movie story nodes fail closed when consent is revoked', () => {
  const result = normalizeLifeMovieStoryNode({
    id: 'node:1', memoryId: 'memory:1', truthClass: 'RECORDED_SOURCE_TRUTH', confidence: 1, consentState: 'revoked',
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'revoked-consent');
});

test('multiple recollections remain separate rather than being collapsed into one claim', () => {
  const result = normalizeLifeMovieStoryNode({
    id: 'node:1',
    memoryId: 'memory:1',
    truthClass: 'ATTRIBUTED_FAMILY_RECOLLECTION',
    confidence: 0.8,
    consentState: 'authorized',
    recollections: [
      { id: 'r:1', sourceId: 'source:1', text: 'Version one', confidence: 0.8 },
      { id: 'r:2', sourceId: 'source:2', text: 'Version two', confidence: 0.7 },
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.node.recollections.length, 2);
  assert.notEqual(result.node.recollections[0].sourceId, result.node.recollections[1].sourceId);
});

test('story graph rejects duplicate node or memory identity', () => {
  const base = { truthClass: 'RECORDED_SOURCE_TRUTH', confidence: 1, consentState: 'authorized' };
  const duplicate = buildLifeMovieStoryGraph([
    { ...base, id: 'node:1', memoryId: 'memory:1' },
    { ...base, id: 'node:1', memoryId: 'memory:2' },
  ]);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.reason, 'ambiguous-identity');
});
