import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture, callables, ownerRequest, request } from '../helpers/storytime-privacy-fixture.mjs';

const ledgerNames = ['storytimeSafetyReportCounters', 'storytimeProviderBudgetCounters', 'storytimeProviderBudgetReservations', 'storytimeProviderDeadLetters'];

test('account export inventory includes only the owner ledger records, never global or another user budgets', async () => {
  const f = fixture(); const c = await callables(f); request(f, 'export', 'account');
  for (const name of ledgerNames) {
    f.put(`${name}/owned`, { userId: 'owner' });
    f.put(`${name}/other-user`, { userId: 'owner-b' });
    f.put(`${name}/global`, { scope: 'global_day' });
  }
  await c.processStorytimeExportRequest(ownerRequest({ privacyRequestId: 'privacy' }));
  const body = JSON.parse([...f.files].find(([path]) => path.endsWith('/storytime-export.json'))[1]);
  for (const name of ledgerNames) assert.deepEqual(body.collections[name].map(row => row.id), ['owned'], name);
});

test('account deletion retains safety/spend ledgers and blocks false completion pending governed retention review', async () => {
  const prior = process.env.STORYTIME_FIREBASE_ISOLATED; process.env.STORYTIME_FIREBASE_ISOLATED = 'true';
  try {
    for (const name of ledgerNames) {
      const f = fixture(); const c = await callables(f); request(f, 'deletion', 'account');
      f.put(`${name}/owned-ledger`, { userId: 'owner' });
      const result = await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
      const plan = [...f.records].find(([path]) => path.startsWith('privacyDeletionPlans/'))[1].plan;
      assert.ok(plan.retainedData.includes(name), name);
      assert.equal(plan.targets[name], undefined, 'retained ledger must never be a destructive target');
      assert.ok(result.executionBlockers.includes(`account_ledger_retention_review_required:${name}`), name);
      assert.deepEqual(plan.targets.storySessions, ['session']);
      assert.equal(result.readyForAdminExecution, false);
    }
  } finally { if (prior === undefined) delete process.env.STORYTIME_FIREBASE_ISOLATED; else process.env.STORYTIME_FIREBASE_ISOLATED = prior; }
});

test('accounts without ledger records do not acquire a fabricated ledger blocker', async () => {
  const prior = process.env.STORYTIME_FIREBASE_ISOLATED; process.env.STORYTIME_FIREBASE_ISOLATED = 'true';
  try {
    const f = fixture(); const c = await callables(f); request(f, 'deletion', 'account');
    const result = await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
    assert.equal(result.executionBlockers.length, 0);
  } finally { if (prior === undefined) delete process.env.STORYTIME_FIREBASE_ISOLATED; else process.env.STORYTIME_FIREBASE_ISOLATED = prior; }
});
