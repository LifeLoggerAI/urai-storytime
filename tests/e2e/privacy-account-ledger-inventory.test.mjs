import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../functions/src/privacy-execution.ts', import.meta.url), 'utf8');
const ledgerNames = ['storytimeSafetyReportCounters', 'storytimeProviderBudgetCounters', 'storytimeProviderBudgetReservations', 'storytimeProviderDeadLetters'];
function between(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `missing source section ${start}`);
  return source.slice(a, b);
}
const definitions = between(source.includes('const accountRetainedLedgerCollections') ? 'const accountRetainedLedgerCollections' : 'const accountUserCollections', 'type PrivacyScope');
const compiled = ts.transpileModule([
  definitions,
  between('async function collectAccountRows(', 'async function collectSessionRows('),
  between('async function buildDeletionPlan(', 'async function deleteTargets('),
].join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

function routines(fixtures) {
  const context = vm.createContext({
    db: { collection: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }) },
    listByField: async (name, field, value) => (fixtures[name] ?? []).filter(row => row.data[field] === value),
    exportStorageObjects: async () => [], activeLegalHold: async () => false,
    familyMemberships: async () => ({ memberships: [], truncated: false }),
    flattenExternalRows: () => [], externalArtifactPointers: () => [],
    nowIso: () => '2026-09-26T00:00:00.000Z',
    STORYTIME_DELETION_PLAN_SCHEMA_VERSION: 'storytime-deletion-plan-v1',
    process: { env: { STORYTIME_FIREBASE_ISOLATED: 'true', STORYTIME_BACKUP_RETENTION_POLICY_READY: 'true' } },
  });
  vm.runInContext(`${compiled}\nthis.collect = collectAccountRows; this.plan = buildDeletionPlan;`, context);
  return context;
}

test('account export inventory includes only the owner ledger records, never global or another user budgets', async () => {
  const fixtures = Object.fromEntries(ledgerNames.map(name => [name, [
    { id: 'owned', data: { userId: 'owner-a' } },
    { id: 'other-user', data: { userId: 'owner-b' } },
    { id: 'global', data: { scope: 'global_day' } },
  ]]));
  const rows = await routines(fixtures).collect('owner-a');
  for (const name of ledgerNames) assert.deepEqual(Array.from(rows[name] ?? [], row => row.id), ['owned'], name);
});

test('account deletion retains safety/spend ledgers and blocks false completion pending governed retention review', async () => {
  for (const name of ledgerNames) {
    const { plan } = routines({ [name]: [{ id: 'owned-ledger', data: { userId: 'owner-a' } }], storySessions: [{ id: 'story', data: { userId: 'owner-a' } }] });
    const result = await plan('privacy-a', { userId: 'owner-a', scope: 'account' });
    assert.ok(result.retainedData.includes(name), name);
    assert.equal(result.targets[name], undefined, 'retained ledger must never be a destructive target');
    assert.ok(result.executionBlockers.includes(`account_ledger_retention_review_required:${name}`), name);
    assert.deepEqual(Array.from(result.targets.storySessions), ['story']);
  }
});

test('accounts without ledger records do not acquire a fabricated ledger blocker', async () => {
  const result = await routines({}).plan('privacy-a', { userId: 'owner-a', scope: 'account' });
  assert.equal(result.executionBlockers.length, 0);
});
