import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, callables, ownerRequest, adminRequest, request } from '../helpers/storytime-privacy-fixture.mjs';
import { exportRuntime } from '../fixtures/storytime-export-runtime.mjs';

async function deletion() {
  const f = fixture(); request(f, 'deletion', 'story_session'); const c = await callables(f);
  const plan = await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
  const execute = () => c.executeStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy', expectedPlanHash: plan.planHash, confirmation: 'DELETE_STORYTIME_DATA' }));
  return { f, c, plan, execute };
}

for (const reason of ['revoked', 'disabled', 'role']) test(`current provider admin ${reason} denies original-plan destructive admission`, async () => {
  const { f, execute } = await deletion();
  if (reason === 'revoked') f.hooks.revokedAdmin = true;
  if (reason === 'disabled') f.hooks.disabledAdmin = true;
  if (reason === 'role') f.hooks.adminRole = false;
  await assert.rejects(execute()); assert.equal(f.records.has('storySessions/session'), true);
  assert.equal(f.records.has('storyVersions/version'), true); assert.equal(f.records.get('privacyRequests/privacy').executionState, 'plan_ready');
});

for (const reason of ['revoked', 'disabled', 'email']) test(`current owner ${reason} denies original-plan preparation`, async () => {
  const f = fixture(); request(f, 'deletion', 'story_session'); const c = await callables(f);
  if (reason === 'revoked') f.hooks.revokedOwner = true;
  if (reason === 'disabled') f.hooks.disabledOwner = true;
  if (reason === 'email') f.hooks.ownerVerified = false;
  await assert.rejects(c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' })));
  assert.equal([...f.records.keys()].some(path => path.startsWith('privacyDeletionPlans/')), false);
});

test('current credential withdrawn during provider account read cannot install a plan', async () => {
  const f = fixture(); request(f, 'deletion', 'story_session'); const c = await callables(f);
  f.hooks.afterUser = async uid => { if (uid === 'owner') f.hooks.revokedOwner = true; };
  await assert.rejects(c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' })));
  assert.equal([...f.records.keys()].some(path => path.startsWith('privacyDeletionPlans/')), false);
});

test('owner withdrawn during awaited source planning cannot persist the old plan', async () => {
  const f = fixture(); request(f, 'deletion', 'story_session'); const c = await callables(f);
  f.hooks.afterRead = async path => { if (path === 'storySessions/session') f.hooks.revokedOwner = true; };
  await assert.rejects(c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' })));
  assert.equal([...f.records.keys()].some(path => path.startsWith('privacyDeletionPlans/')), false);
});

for (const reason of ['revoked', 'role']) test(`admin ${reason} after awaited child read preserves the exact remaining child`, async () => {
  const { f, execute } = await deletion(); f.hooks.afterRead = async path => {
    if (path === 'storyVersions/version') { if (reason === 'revoked') f.hooks.revokedAdmin = true; else f.hooks.adminRole = false; }
  };
  await assert.rejects(execute()); assert.equal(f.records.has('storyVersions/version'), true);
  assert.equal(f.records.get('privacyRequests/privacy').deletionCompletionVerified, false);
});

for (const reason of ['revoked', 'role']) test(`admin ${reason} denies verification after original physical mutations`, async () => {
  const { f, c, execute } = await deletion(); await execute();
  if (reason === 'revoked') f.hooks.revokedAdmin = true; else f.hooks.adminRole = false;
  await assert.rejects(c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' })));
  assert.equal(f.records.get('privacyRequests/privacy').executionState, 'verification_required');
  assert.equal(f.records.get('privacyRequests/privacy').deletionCompletionVerified, false);
});

test('verification cannot overwrite request cancellation introduced during original target reads', async () => {
  const { f, c, execute } = await deletion(); await execute(); const getAll = f.db.getAll; let withdrawn = false;
  f.db.getAll = async (...refs) => { const rows = await getAll(...refs); if (!withdrawn) { withdrawn = true;
    f.put('privacyRequests/privacy', { ...f.records.get('privacyRequests/privacy'), status: 'cancelled' }); } return rows; };
  await assert.rejects(c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' })));
  assert.equal(withdrawn, true); assert.equal(f.records.get('privacyRequests/privacy').status, 'cancelled');
  assert.equal(f.records.get('privacyRequests/privacy').deletionCompletionVerified, false);
});

test('new original child at verification commit cannot become a completed receipt', async () => {
  const prior = process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY; process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY = 'true';
  try {
    const { f, c, execute } = await deletion(); await execute(); let restored = false;
    f.hooks.beforeCommit = async writes => { if (!restored && writes.some(write => write.path === 'privacyRequests/privacy')) {
      restored = true; f.put('storyVersions/version', { userId: 'owner', sessionId: 'session', correction: 'Synthetic restored original' }); } };
    await assert.rejects(c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' })));
    assert.equal(restored, true); assert.equal(f.records.has('storyVersions/version'), true);
    assert.notEqual(f.records.get('privacyRequests/privacy').executionState, 'completed');
  } finally { if (prior === undefined) delete process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY; else process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY = prior; }
});

test('new owner child conflicts with verification query emptiness at commit', async () => {
  const { f, c, execute } = await deletion(); await execute(); let admitted = false;
  f.hooks.beforeCommit = async writes => { if (!admitted && writes.some(write => write.path === 'privacyRequests/privacy')) {
    admitted = true; f.put('storyVersions/new-late-child', { userId: 'owner', sessionId: 'session', synthetic: true }); } };
  await assert.rejects(c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' })));
  assert.equal(admitted, true); assert.equal(f.records.has('storyVersions/new-late-child'), true);
  assert.equal(f.records.get('privacyRequests/privacy').deletionCompletionVerified, false);
});

test('owner token withdrawn while a privacy request transaction reads cannot create it', async () => {
  const f = await exportRuntime(); f.onTransactionRead = async path => { if (path?.startsWith('privacyRequests/')) f.tokenRevoked = true; };
  await assert.rejects(f.module.requestPrivacyOperation(f.owner({ requestId: 'synthetic-current-request', type: 'export', scope: 'account', confirmation: true })));
  assert.equal([...f.records.keys()].some(path => path.startsWith('privacyRequests/')), false);
});

test('owner withdrawal after awaited package write stops manifest and publication', async () => {
  const f = await exportRuntime(); const created = await f.module.requestPrivacyOperation(f.owner({ requestId: 'synthetic-current-package', type: 'export', scope: 'account', confirmation: true }));
  f.onSave = async () => { f.tokenRevoked = true; };
  await assert.rejects(f.module.processStorytimeExportRequest(f.owner({ privacyRequestId: created.privacyRequestId })));
  assert.equal([...f.files.keys()].some(path => path.endsWith('/manifest.json')), false);
  assert.notEqual(f.records.get('privacyRequests/' + created.privacyRequestId).executionState, 'completed');
});

test('owner token withdrawn during descriptor metadata read issues no capability', async () => {
  const f = await exportRuntime(); await f.grant(); f.onMetadata = () => { f.tokenRevoked = true; };
  await assert.rejects(f.module.getStorytimeExportDownloadUrl(f.owner({ privacyRequestId: f.requestId })));
});

test('provider disabled account after metadata emits no private bytes', async () => {
  const f = await exportRuntime(); const grant = await f.grant(); f.onMetadata = () => { f.disabled = true; };
  const response = await f.deliver(grant); assert.equal(response.chunks.length, 0); assert.equal(f.streams, 0);
});

test('owner token withdrawn during awaited chunk authority emits no stale first chunk', async () => {
  const f = await exportRuntime({ body: 's'.repeat(160000) }); const grant = await f.grant(); let reads = 0;
  f.onTransactionRead = async path => { if (path === 'privacyRequests/' + f.requestId && ++reads === 3) f.tokenRevoked = true; };
  const response = await f.deliver(grant); assert.ok(reads >= 3); assert.equal(response.chunks.length, 0);
});

test('stale owner token cannot revoke a currently bound private export request', async () => {
  const f = await exportRuntime(); await f.grant(); f.tokenRevoked = true;
  await assert.rejects(f.module.revokeStorytimeExportRequest(f.owner({ privacyRequestId: f.requestId })));
  assert.equal(f.request().executionState, 'completed');
});

test('current provider admin and explicit backup gate preserve successful exact-plan completion', async () => {
  const prior = process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY; process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY = 'true';
  try {
    const { f, c, execute } = await deletion(); await execute();
    const value = await c.verifyStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy' }));
    assert.equal(value.completed, true); assert.ok(value.completionReceiptId);
    assert.equal(f.records.get('privacyRequests/privacy').deletionCompletionVerified, true);
    assert.equal(f.records.has('storyVersions/version'), false); assert.equal(f.records.has('storyVersions/foreign'), true);
  } finally { if (prior === undefined) delete process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY; else process.env.STORYTIME_BACKUP_RETENTION_POLICY_READY = prior; }
});
