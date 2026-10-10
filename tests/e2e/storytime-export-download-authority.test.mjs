import test from 'node:test';
import assert from 'node:assert/strict';
import { exportRuntime } from '../fixtures/storytime-export-runtime.mjs';

test('actual confirmed Storytime export delivers only with live owner token and a committed receipt', async () => {
  const f = await exportRuntime(); const grant = await f.grant();
  assert.equal(grant.requiresAuthorization, true);
  assert.equal(new URL(grant.url).hostname, 'us-central1-urai-storytime-test.cloudfunctions.net');
  const response = await f.deliver(grant);
  assert.equal(response.statusCode, 200); assert.equal(response.denial, null);
  assert.ok(response.chunks.length); assert.equal(f.signedUrls, 0);
  const delivered = JSON.parse(Buffer.concat(response.chunks).toString());
  assert.equal(delivered.collections.storyVersions[0].snapshot.body, 'synthetic private story');
  assert.ok([...f.records.values()].some(row => row.type === 'export_download_authorized'));
  assert.ok(f.tokens.every(([, checkRevoked]) => checkRevoked === true));
});

for (const [token, status] of [[null, 401], ['revoked', 401], ['foreign', 403], ['unverified', 409]]) {
  test(`actual export byte handler denies ${token ?? 'missing'} token before opening Storage`, async () => {
    const f = await exportRuntime(); const grant = await f.grant(); const response = await f.deliver(grant, token);
    assert.equal(response.statusCode, status); assert.equal(response.chunks.length, 0); assert.equal(f.streams, 0);
  });
}

test('withdrawal denies the same already-issued export URL', async () => {
  const f = await exportRuntime(); const grant = await f.grant();
  await f.module.revokeStorytimeExportRequest(f.owner({ privacyRequestId: f.requestId }));
  const response = await f.deliver(grant);
  assert.equal(response.statusCode, 409); assert.equal(response.chunks.length, 0); assert.equal(f.streams, 0);
});

for (const status of ['requested', 'processing', 'completed']) {
  test(`relevant ${status} session deletion denies a prior account export URL`, async () => {
    const f = await exportRuntime(); const grant = await f.grant();
    f.put('privacyRequests/deletion', { userId: 'owner', type: 'deletion', scope: 'story_session', sessionId: 'session', status });
    const response = await f.deliver(grant);
    assert.equal(response.statusCode, 409); assert.equal(response.chunks.length, 0); assert.equal(f.streams, 0);
  });
}

test('foreign unrelated deletion cannot revoke another owners export', async () => {
  const f = await exportRuntime(); const grant = await f.grant();
  f.put('privacyRequests/deletion', { userId: 'foreign', type: 'deletion', scope: 'account', status: 'requested' });
  const response = await f.deliver(grant); assert.equal(response.statusCode, 200); assert.ok(response.chunks.length);
});

for (const change of ['source', 'receipt', 'package', 'expiry']) {
  test(`${change} drift invalidates an already-issued export URL`, async () => {
    const f = await exportRuntime(); const grant = await f.grant();
    if (change === 'source') f.put('storyVersions/version', undefined);
    if (change === 'receipt') f.put(`privacyOperationReceipts/${f.request().completionReceiptId}`, undefined);
    if (change === 'package') f.changeRequest({ exportPath: 'foreign/export.json' });
    if (change === 'expiry') f.now += 16 * 60 * 1000;
    const response = await f.deliver(grant);
    assert.equal(response.statusCode, 409); assert.equal(response.chunks.length, 0); assert.equal(f.streams, 0);
  });
}

test('source withdrawal during awaited object metadata is fenced by the final transaction', async () => {
  const f = await exportRuntime(); const grant = await f.grant();
  f.onMetadata = () => f.put('storyVersions/version', undefined);
  const response = await f.deliver(grant);
  assert.equal(response.statusCode, 409); assert.equal(response.chunks.length, 0); assert.equal(f.streams, 0);
});

test('an audit commit failure emits no private export bytes', async () => {
  const f = await exportRuntime(); const grant = await f.grant(); f.failCommit = true;
  const response = await f.deliver(grant);
  assert.equal(response.statusCode, 500); assert.equal(response.chunks.length, 0); assert.equal(f.streams, 0);
});

for (const change of ['withdrawal', 'deletion', 'token', 'deadline', 'source']) {
  test(`mid-stream ${change} stops the next export chunk`, async () => {
    const f = await exportRuntime({ body: 'x'.repeat(160_000) }); const grant = await f.grant();
    f.onFirstWrite = () => {
      if (change === 'withdrawal') f.changeRequest({ status: 'cancelled', executionState: 'revoked' });
      if (change === 'deletion') f.put('privacyRequests/deletion', { userId: 'owner', type: 'deletion', scope: 'account', status: 'requested' });
      if (change === 'token') f.tokenRevoked = true;
      if (change === 'deadline') f.monotonic += 500_001;
      if (change === 'source') f.put('storyVersions/version', undefined);
    };
    const response = await f.deliver(grant);
    assert.equal(response.chunks.length, 1); assert.equal(response.chunks[0].length, 64 * 1024);
    assert.equal(response.destroyed, true);
  });
}

test('confirmed request identity cannot be replayed with a different scope', async () => {
  const f = await exportRuntime(); await f.grant();
  const original = f.request();
  await assert.rejects(f.module.requestPrivacyOperation(f.owner({ requestId: original.requestId, type: 'export', scope: 'story_session', sessionId: 'session', confirmation: true })),
    error => error.code === 'failed-precondition');
});
