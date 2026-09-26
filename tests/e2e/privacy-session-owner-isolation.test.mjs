import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the actual collection routine with synthetic datastore dependencies.
// A request ID is client-provided and is not an ownership boundary.
const source = readFileSync(new URL('../../functions/src/privacy-execution.ts', import.meta.url), 'utf8');
const start = source.indexOf('async function collectSessionRows(');
const end = source.indexOf('\nfunction recordCounts(', start);
assert.ok(start >= 0 && end > start, 'session collection routine must be present');
const compiled = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function routine({ session, moderation, denied = false }) {
  const queries = [];
  const context = vm.createContext({
    assertOwnedSession: async () => {
      if (denied) throw new Error('session owner mismatch');
      return { id: 'session-a', data: session };
    },
    sessionScalarCollections: [],
    sessionArrayCollections: [],
    listByField: async (...query) => { queries.push(query); return moderation; },
    listByArrayContains: async () => [],
    db: { collection: () => { throw new Error('unexpected datastore lookup'); } },
  });
  vm.runInContext(`${compiled}\nthis.collect = collectSessionRows;`, context);
  return { collect: context.collect, queries };
}

test('session export and deletion inventory excludes cross-owner moderation with a colliding request ID', async () => {
  const { collect, queries } = routine({
    session: { userId: 'owner-a', requestId: 'shared-request-id' },
    moderation: [
      { id: 'owned', data: { userId: 'owner-a', requestId: 'shared-request-id' } },
      { id: 'other-owner', data: { userId: 'owner-b', requestId: 'shared-request-id' } },
      { id: 'unattributed', data: { requestId: 'shared-request-id' } },
    ],
  });
  const rows = await collect('owner-a', 'session-a');
  assert.deepEqual(Array.from(rows.moderation, row => row.id), ['owned']);
  assert.deepEqual(queries, [['moderation', 'requestId', 'shared-request-id']]);
});

test('a session without a request ID does not query unrelated moderation', async () => {
  const { collect, queries } = routine({ session: { userId: 'owner-a' }, moderation: [] });
  const rows = await collect('owner-a', 'session-a');
  assert.equal(rows.moderation.length, 0);
  assert.equal(queries.length, 0);
});

test('owner authorization precedes related-record lookup', async () => {
  const { collect, queries } = routine({ session: {}, moderation: [], denied: true });
  await assert.rejects(collect('other-owner', 'session-a'), /owner mismatch/);
  assert.equal(queries.length, 0);
});
