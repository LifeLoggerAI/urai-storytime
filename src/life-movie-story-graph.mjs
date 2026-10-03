export const LIFE_MOVIE_TRUTH_CLASSES = Object.freeze([
  'RECORDED_SOURCE_TRUTH',
  'ATTRIBUTED_FAMILY_RECOLLECTION',
  'SPATIALLY_RECONSTRUCTABLE',
  'INTERPRETIVE_CINEMATIC_RECREATION',
  'UNKNOWN_UNRESOLVED',
]);

const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;

function token(value) {
  return typeof value === 'string' && SAFE_ID.test(value) ? value : null;
}

function tokenArray(value) {
  return Array.isArray(value) ? value.map(token).filter(Boolean) : [];
}

export function normalizeLifeMovieStoryNode(input = {}) {
  const id = token(input.id);
  const memoryId = token(input.memoryId);
  const truthClass = LIFE_MOVIE_TRUTH_CLASSES.includes(input.truthClass) ? input.truthClass : null;
  const confidence = Number(input.confidence);
  const consentState = input.consentState === 'authorized' ? 'authorized'
    : input.consentState === 'pending' ? 'pending'
    : input.consentState === 'revoked' ? 'revoked'
    : null;

  if (!id || !memoryId || !truthClass || !Number.isFinite(confidence) || confidence < 0 || confidence > 1 || !consentState) {
    return { ok: false, reason: 'invalid-node' };
  }
  if (consentState === 'revoked') return { ok: false, reason: 'revoked-consent' };

  const recollections = Array.isArray(input.recollections) ? input.recollections.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const recollectionId = token(entry.id);
    const sourceId = token(entry.sourceId);
    const text = typeof entry.text === 'string' && entry.text.trim() ? entry.text.trim().slice(0, 2000) : null;
    if (!recollectionId || !sourceId || !text) return [];
    return [{
      id: recollectionId,
      sourceId,
      text,
      confidence: Number.isFinite(Number(entry.confidence)) ? Math.max(0, Math.min(1, Number(entry.confidence))) : confidence,
      relationshipToNode: token(entry.relationshipToNode) ?? 'supports',
    }];
  }) : [];

  return {
    ok: true,
    node: {
      id,
      memoryId,
      title: typeof input.title === 'string' ? input.title.trim().slice(0, 160) : '',
      truthClass,
      confidence,
      consentState,
      personIds: tokenArray(input.personIds),
      placeIds: tokenArray(input.placeIds),
      objectIds: tokenArray(input.objectIds),
      relationshipIds: tokenArray(input.relationshipIds),
      sourceIds: tokenArray(input.sourceIds),
      cinematicAssetIds: tokenArray(input.cinematicAssetIds),
      spatialAssetIds: tokenArray(input.spatialAssetIds),
      recollections,
      unresolved: Array.isArray(input.unresolved) ? input.unresolved.filter((value) => typeof value === 'string').map((value) => value.trim().slice(0, 500)).filter(Boolean) : [],
    },
  };
}

export function buildLifeMovieStoryGraph(nodes = []) {
  const normalized = nodes.map(normalizeLifeMovieStoryNode);
  if (normalized.some((result) => !result.ok)) return { ok: false, reason: 'invalid-node', graph: null };
  const values = normalized.map((result) => result.node);
  const ids = new Set(values.map((node) => node.id));
  const memoryIds = new Set(values.map((node) => node.memoryId));
  if (ids.size !== values.length || memoryIds.size !== values.length) return { ok: false, reason: 'ambiguous-identity', graph: null };
  return {
    ok: true,
    graph: {
      version: 1,
      nodes: values,
      edges: values.flatMap((node) => node.relationshipIds.map((relationshipId) => ({ from: node.id, relationshipId }))),
    },
  };
}
