import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync(new URL('../../src/lib/storytime/export-download.ts', import.meta.url), 'utf8');
const { fetchAuthorizedStorytimeExport, STORYTIME_EXPORT_BROWSER_MAX_BYTES } =
  await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));

const projectId = 'urai-storytime-test';
const payload = { schemaVersion: 'storytime-export-v1', collections: { storySessions: [{ id: 'synthetic-owned' }] } };
const content = JSON.stringify(payload);
const expectedHash = createHash('sha256').update(content).digest('hex');
const grant = () => {
  const expiresAt = Date.now() + 120_000;
  return { privacyRequestId: 'synthetic-request', requiresAuthorization: true, expiresAt: new Date(expiresAt).toISOString(),
    packageSha256: expectedHash,
    url: `https://us-central1-${projectId}.cloudfunctions.net/downloadStorytimeExportPackage?privacyRequestId=synthetic-request&expiresAt=${expiresAt}&authorityHash=${'a'.repeat(64)}` };
};
function args(fetcher, isCurrentAccount = () => true, authorization = grant()) {
  return { projectId, authorization, getIdToken: async () => 'synthetic-private-token', isCurrentAccount, fetcher };
}
const ok = body => new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });

test('auth-bound Storytime export streams a byte-identical verified private package', async () => {
  let captured;
  const blob = await fetchAuthorizedStorytimeExport(args(async (url, options) => {
    captured = { url, options }; return ok(content);
  }));
  assert.equal(await blob.text(), content);
  assert.equal(captured.options.redirect, 'error');
  assert.equal(captured.options.credentials, 'omit');
  assert.equal(captured.options.headers.Authorization, 'Bearer synthetic-private-token');
  assert.ok(captured.options.signal instanceof AbortSignal);
});

test('oversized declared private export is rejected before reading bytes', async () => {
  const response = new Response('small', { status: 200, headers: {
    'content-type': 'application/json', 'content-length': String(STORYTIME_EXPORT_BROWSER_MAX_BYTES + 1)
  } });
  await assert.rejects(() => fetchAuthorizedStorytimeExport(args(async () => response)), /safe browser size limit/);
});

test('a dishonest stream without content-length cannot exceed the browser budget', async () => {
  const part = new Uint8Array(8 * 1024 * 1024); let pulls = 0, cancelled = false;
  const stream = new ReadableStream({
    pull(controller) {
      if (++pulls <= 18) controller.enqueue(part);
      else controller.close();
    },
    cancel() { cancelled = true; }
  });
  await assert.rejects(() => fetchAuthorizedStorytimeExport(args(async () => ok(stream))), /safe browser size limit/);
  assert.equal(cancelled, true);
  assert.ok(pulls <= 18, 'consumer must not exhaust an arbitrarily large response');
});

test('account switch during async byte retrieval cancels and never returns stale private data', async () => {
  let current = true, cancelCalled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode(content.slice(0, 12))); },
    pull(controller) {
      current = false;
      controller.enqueue(new TextEncoder().encode(content.slice(12)));
    },
    cancel() { cancelCalled = true; }
  });
  await assert.rejects(() => fetchAuthorizedStorytimeExport(args(async () => ok(stream), () => current)), /account changed/);
  assert.equal(cancelCalled, true);
});

test('wrong package digest never releases private bytes to the caller', async () => {
  const authorization = { ...grant(), packageSha256: '0'.repeat(64) };
  await assert.rejects(() => fetchAuthorizedStorytimeExport(args(async () => ok(content), () => true, authorization)), /integrity check failed/);
});

test('unauthorized redirect or expired descriptor rejects before private HTTP request', async () => {
  let called = false; const fetcher = async () => { called = true; return ok(content); };
  const redirected = grant(); redirected.url = 'https://attacker.example/downloadStorytimeExportPackage';
  await assert.rejects(() => fetchAuthorizedStorytimeExport(args(fetcher, () => true, redirected)), /not authorized/);
  assert.equal(called, false);
  const expired = grant(); expired.expiresAt = new Date(Date.now() - 1000).toISOString();
  await assert.rejects(() => fetchAuthorizedStorytimeExport(args(fetcher, () => true, expired)), /not authorized/);
  assert.equal(called, false);
});
