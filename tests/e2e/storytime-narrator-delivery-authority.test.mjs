import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { Writable } from 'node:stream';
import { exportRuntime } from '../fixtures/storytime-export-runtime.mjs';

const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { z } = require('zod');
let moduleId = 0;

async function fixture({ bytes = 100 } = {}) {
  const f = await exportRuntime(); f.bridgeToken = 'synthetic-server-bridge-token'; f.bridgeCalls = [];
  f.delivery = { schemaVersion: 'urai-authenticated-private-media-v1', requiresAuthorization: true, action: 'deliver', kind: 'audio',
    authorityHash: 'a'.repeat(64), expiresAt: f.now + 60_000, generation: '42', jobId: 'job-a', sessionId: 'session', narratorScriptId: 'script-a' };
  f.put('voiceoverJobs/voice-a', { userId: 'owner', externalSystem: 'urai-jobs', externalJobId: 'job-a',
    sessionId: 'session', narratorScriptId: 'script-a', consentReceiptId: 'consent-a', status: 'completed' });
  f.put('storySessions/session', { userId: 'owner', safetyStatus: 'approved', currentVersionId: 'version-a', consentSnapshot: { voiceover: true } });
  f.put('narratorScripts/script-a', { userId: 'owner', sessionId: 'session', text: 'synthetic narrator source' });
  f.put('consentDecisionReceipts/consent-a', { userId: 'owner', purpose: 'storytime.voiceover', policyVersion: 'storytime-voiceover-consent-v1',
    decision: 'authorized', sourceSessionId: 'session', narratorScriptId: 'script-a' });
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  class FieldPath { static documentId() { return '__name__'; } }
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [f.now])); } static now() { return f.now; } }
  const key = `storytime-narrator-fixture-${++moduleId}`;
  globalThis[key] = { z, f, Clock, HttpsError, FieldPath, getFirestore: () => f.db, getAuth: () => f.auth,
    onRequest: (_options, callback) => callback, storytimeJobsBridgeTokenSecret: {}, storytimeJobsBridgeToken: () => f.bridgeToken,
    storytimeJobsBridgeUrl: () => 'https://jobs.synthetic.invalid/storytimeNarratorBridge', performance: { now: () => f.monotonic },
    fetch: async (url, options) => {
      f.bridgeCalls.push({ url, options }); if (f.onUpstream) await f.onUpstream();
      return new Response(new Uint8Array(bytes), { headers: { 'content-type': 'audio/mpeg' } });
    } };
  const common = `const { z, f, Clock, HttpsError, FieldPath, getFirestore, getAuth, onRequest, storytimeJobsBridgeTokenSecret, storytimeJobsBridgeToken, storytimeJobsBridgeUrl, performance, fetch } = globalThis[${JSON.stringify(key)}]; const Date = Clock;\n`;
  try {
    const contract = readFileSync('functions/src/storytime-media-delivery-contract.ts', 'utf8').replace(/^import[^\n]*\n/gm, '');
    const contractModule = await import(`data:text/javascript;base64,${Buffer.from(common + stripTypeScriptTypes(contract)).toString('base64')}`);
    globalThis[key].StorytimeNarratorDeliverySchema = contractModule.StorytimeNarratorDeliverySchema;
    const raw = readFileSync('functions/src/storytime-voiceover-delivery.ts', 'utf8').replace(/^import[\s\S]*?from "[^"]+";\n/gm, '');
    const prelude = `import { createHash } from 'node:crypto'; import { Readable } from 'node:stream'; import { pipeline } from 'node:stream/promises';\n${common}const { StorytimeNarratorDeliverySchema } = globalThis[${JSON.stringify(key)}];\n`;
    f.handler = (await import(`data:text/javascript;base64,${Buffer.from(prelude + stripTypeScriptTypes(raw)).toString('base64')}`)).deliverStorytimeVoiceover;
  } finally { delete globalThis[key]; }
  f.deliver = async (token = 'valid', delivery = f.delivery) => {
    class ResponseSink extends Writable {
      constructor() { super(); this.headers = {}; this.chunks = []; this.statusCode = 200; }
      set(name, value) { Object.assign(this.headers, typeof name === 'string' ? { [name]: value } : name); return this; }
      status(value) { this.statusCode = value; return this; } json(value) { this.denial = value; return this; }
      get headersSent() { return this.chunks.length > 0; }
      _write(chunk, _encoding, callback) { this.chunks.push(Buffer.from(chunk)); if (this.chunks.length === 1 && f.onFirstWrite) f.onFirstWrite(); callback(); }
    }
    const sink = new ResponseSink();
    await f.handler({ method: 'POST', body: { voiceoverJobId: 'voice-a', delivery },
      get: name => name.toLowerCase() === 'authorization' && token ? `Bearer ${token}` : undefined }, sink);
    return sink;
  };
  return f;
}

test('actual narrator byte proxy forwards only deliver with the existing protected bridge credential', async () => {
  const f = await fixture(); const sink = await f.deliver();
  assert.equal(sink.statusCode, 200); assert.equal(Buffer.concat(sink.chunks).length, 100);
  assert.equal(sink.headers['Content-Type'], 'audio/mpeg'); assert.equal(sink.headers['Content-Length'], undefined);
  assert.equal(f.bridgeCalls.length, 1); const request = f.bridgeCalls[0];
  assert.equal(request.options.headers.Authorization, 'Bearer synthetic-server-bridge-token');
  assert.equal(request.options.redirect, 'error'); assert.equal(request.options.cache, 'no-store');
  assert.deepEqual(JSON.parse(request.options.body), { action: 'deliver', kind: 'audio', userId: 'owner', sessionId: 'session',
    narratorScriptId: 'script-a', jobId: 'job-a', authorityHash: 'a'.repeat(64), expiresAt: f.delivery.expiresAt, generation: '42' });
  assert.ok([...f.records.values()].some(row => row.type === 'voiceover_delivery_authorized'));
});

for (const token of [null, 'revoked', 'foreign', 'unverified']) {
  test(`invalid ${token ?? 'missing'} narrator account never sends the bridge credential`, async () => {
    const f = await fixture(); const sink = await f.deliver(token);
    assert.equal(sink.chunks.length, 0); assert.equal(f.bridgeCalls.length, 0);
  });
}

for (const change of ['consent', 'deletion', 'script', 'binding']) {
  test(`current ${change} denial prevents the upstream narrator request`, async () => {
    const f = await fixture();
    if (change === 'consent') f.put('consentDecisionReceipts/consent-a', undefined);
    if (change === 'deletion') f.put('privacyRequests/delete-a', { userId: 'owner', type: 'deletion', scope: 'account', status: 'requested' });
    if (change === 'script') f.put('narratorScripts/script-a', undefined);
    if (change === 'binding') f.delivery.jobId = 'foreign-job';
    const sink = await f.deliver(); assert.equal(sink.chunks.length, 0); assert.equal(f.bridgeCalls.length, 0);
  });
}

test('source drift while awaiting the real bridge response emits no browser audio bytes', async () => {
  const f = await fixture(); f.onUpstream = () => f.put('narratorScripts/script-a', { userId: 'owner', sessionId: 'session', text: 'changed source' });
  const sink = await f.deliver(); assert.equal(sink.statusCode, 409); assert.equal(sink.chunks.length, 0);
});

for (const change of ['consent', 'deletion', 'source', 'token', 'bridge-token', 'deadline']) {
  test(`mid-stream narrator ${change} denies the next 64 KiB chunk`, async () => {
    const f = await fixture({ bytes: 160_000 });
    f.onFirstWrite = () => {
      if (change === 'consent') f.put('consentDecisionReceipts/consent-a', undefined);
      if (change === 'deletion') f.put('privacyRequests/delete-a', { userId: 'owner', type: 'deletion', scope: 'story_session', sessionId: 'session', status: 'processing' });
      if (change === 'source') f.put('narratorScripts/script-a', { userId: 'owner', sessionId: 'session', text: 'changed source' });
      if (change === 'token') f.tokenRevoked = true;
      if (change === 'bridge-token') f.bridgeToken = 'rotated';
      if (change === 'deadline') f.monotonic = 100_001;
    };
    const sink = await f.deliver(); assert.equal(sink.chunks.length, 1); assert.equal(sink.chunks[0].length, 64 * 1024);
    assert.equal(sink.destroyed, true);
  });
}
