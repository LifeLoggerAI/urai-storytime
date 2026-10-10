import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, callables, ownerRequest, adminRequest, request } from '../helpers/storytime-privacy-fixture.mjs';

for (const scope of ['account', 'story_session']) {
  test(`${scope} export includes only owner-scoped private story versions`, async () => {
    const f = fixture(); const c = await callables(f); request(f, 'export', scope);
    await c.processStorytimeExportRequest(ownerRequest({ privacyRequestId: 'privacy' }));
    const file = [...f.files.entries()].find(([path]) => path.endsWith('/storytime-export.json'));
    const data = JSON.parse(file[1]);
    assert.deepEqual(data.collections.storyVersions.map(row => row.id), ['version']);
    assert.equal(data.collections.storyVersions[0].snapshot.body, 'synthetic private memory');
    assert.equal(data.inventoryVersion, 'storytime-owner-ledger-inventory-v4');
  });
}

test('session deletion plans include immutable story versions', async () => {
  const f = fixture(); const c = await callables(f); request(f, 'deletion', 'story_session');
  await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
  const plan = [...f.records].find(([path]) => path.startsWith('privacyDeletionPlans/'))[1].plan;
  assert.deepEqual(plan.targets.storyVersions, ['version']);
  assert.equal(plan.targets.storyVersions.includes('foreign'), false);
});

test('session deletion verification accepts the deleted parent and preserves backup policy hold', async () => {
  const previous = process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY;
  delete process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY;
  try {
    const f = fixture(); const c = await callables(f); request(f, 'deletion', 'story_session');
    const plan = await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
    await c.executeStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy', expectedPlanHash: plan.planHash, confirmation: 'DELETE_STORYTIME_DATA' }));
    assert.equal(f.records.has('storySessions/session'), false);
    assert.equal(f.records.has('storyVersions/version'), false);
    const result = await c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' }));
    assert.equal(result.completed, false);
    assert.equal(result.executionState, 'backup_expiry_pending');
    assert.deepEqual(result.blockers, ['backup_expiry_policy_not_certified']);
  } finally {
    if (previous === undefined) delete process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY;
    else process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY = previous;
  }
});

test('verification detects an original moderation target after session deletion', async () => {
  const f = fixture(); const c = await callables(f); request(f, 'deletion', 'story_session');
  f.put('moderation/moderation-row', { userId: 'owner', requestId: 'request' });
  const plan = await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
  await c.executeStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy', expectedPlanHash: plan.planHash, confirmation: 'DELETE_STORYTIME_DATA' }));
  f.put('moderation/moderation-row', { userId: 'owner', requestId: 'request' });
  const result = await c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' }));
  assert.equal(result.completed, false);
  assert.equal(result.executionState, 'verification_failed');
  assert.ok(result.blockers.some(item => item.includes('moderation/moderation-row')));
});

test('ordinary session export still requires a live parent owned by the requester', async () => {
  const f = fixture(); const c = await callables(f); request(f, 'export', 'story_session');
  f.put('storySessions/session', undefined);
  await assert.rejects(c.processStorytimeExportRequest(ownerRequest({ privacyRequestId: 'privacy' })), error => error.code === 'permission-denied');
  assert.equal(f.files.size, 0);
});

test('a completed inventory v3 export is regenerated before reuse', async () => {
  const f = fixture(); const c = await callables(f); request(f, 'export', 'account');
  f.put('privacyRequests/privacy', { ...f.records.get('privacyRequests/privacy'), executionState: 'completed', exportInventoryVersion: 'storytime-owner-ledger-inventory-v3', exportPath: 'old-file', exportManifestPath: 'old-manifest', exportPackageSha256: 'old-hash' });
  const result = await c.processStorytimeExportRequest(ownerRequest({ privacyRequestId: 'privacy' }));
  assert.equal(result.reused, false);
  assert.equal(f.records.get('privacyRequests/privacy').exportInventoryVersion, 'storytime-owner-ledger-inventory-v4');
});

test('verification rejects a re-created foreign session instead of accepting absence', async () => {
  const f = fixture(); const c = await callables(f); request(f, 'deletion', 'story_session');
  const plan = await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
  await c.executeStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy', expectedPlanHash: plan.planHash, confirmation: 'DELETE_STORYTIME_DATA' }));
  f.put('storySessions/session', { userId: 'different-owner' });
  await assert.rejects(c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' })), error => error.code === 'permission-denied');
  assert.equal(f.records.get('privacyRequests/privacy').deletionCompletionVerified, false);
});

test('verification rejects a tampered executed target set', async () => {
  const f = fixture(); const c = await callables(f); request(f, 'deletion', 'story_session');
  const plan = await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
  await c.executeStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy', expectedPlanHash: plan.planHash, confirmation: 'DELETE_STORYTIME_DATA' }));
  const [path, record] = [...f.records].find(([path]) => path.startsWith('privacyDeletionPlans/'));
  f.put(path, { ...record, plan: { ...record.plan, userId: 'different-owner' } });
  await assert.rejects(c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' })), error => error.code === 'failed-precondition');
  assert.equal(f.records.get('privacyRequests/privacy').deletionCompletionVerified, false);
});

