import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';

const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { z } = require('zod');
let moduleId = 0;

function fixture() {
  const records = new Map();
  const files = new Map();
  let nextId = 0;
  const put = (path, value) => value === undefined ? records.delete(path) : records.set(path, structuredClone(value));
  const snapshot = path => ({ id: path.split('/').at(-1), exists: records.has(path), data: () => structuredClone(records.get(path)) });
  const ref = path => ({ path, id: path.split('/').at(-1), get: async () => snapshot(path), set: async value => put(path, value), update: async value => {
    assert.ok(records.has(path), 'update cannot recreate a missing record'); put(path, { ...records.get(path), ...value });
  } });
  const query = (name, filters = [], limit = Infinity, cursor) => ({
    where: (field, operator, value) => query(name, [...filters, [field, operator, value]], limit, cursor),
    orderBy: () => query(name, filters, limit, cursor),
    limit: size => query(name, filters, size, cursor),
    startAfter: next => query(name, filters, limit, next.id),
    get: async () => {
      const docs = [...records.keys()].filter(path => path.startsWith(`${name}/`)).sort().map(snapshot).filter(doc =>
        (!cursor || doc.id > cursor) && filters.every(([field, operator, value]) => {
          const current = Array.isArray(field) ? field.reduce((row, key) => row?.[key], doc.data()) : doc.data()?.[field];
          if (operator === 'array-contains') return Array.isArray(current) && current.includes(value);
          if (operator === 'in') return value.includes(current);
          return current === value;
        })).slice(0, limit);
      return { docs, size: docs.length };
    }
  });
  const db = {
    collection: name => ({ ...query(name), doc: id => ref(`${name}/${id ?? `new-${++nextId}`}`) }),
    getAll: async (...refs) => refs.map(item => snapshot(item.path)),
    batch: () => {
      const deletes = [];
      return { delete: item => deletes.push(item.path), commit: async () => deletes.forEach(path => put(path, undefined)) };
    },
    runTransaction: async callback => {
      const writes = [];
      const result = await callback({ get: item => item.get(),
        update: (item, value) => writes.push(() => item.update(value)),
        create: (item, value) => writes.push(() => item.set(value)) });
      for (const write of writes) await write();
      return result;
    }
  };
  const bucket = {
    getFiles: async () => [[]],
    file: path => ({ save: async data => files.set(path, data), delete: async () => files.delete(path), getSignedUrl: async () => ['fixture-url'] })
  };
  put('storySessions/session', { userId: 'owner', requestId: 'request', currentVersionId: 'version' });
  put('storyVersions/version', { userId: 'owner', sessionId: 'session', immutable: true, snapshot: { body: 'private previous memory' } });
  put('storyVersions/foreign', { userId: 'different-owner', sessionId: 'foreign-session', immutable: true, snapshot: { body: 'must not export' } });
  return { db, bucket, records, files, put };
}

async function callables(f) {
  const key = `storytime-private-version-privacy-${++moduleId}`;
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  class Timestamp {}
  class FieldPath { constructor(...fields) { return fields; } static documentId() { return '__name__'; } }
  globalThis[key] = {
    getApps: () => [{}], initializeApp: () => {}, getFirestore: () => f.db,
    getStorage: () => ({ bucket: () => f.bucket }),
    getAuth: () => ({ getUser: async () => ({ uid: 'owner', emailVerified: true, disabled: false, metadata: {}, providerData: [] }), deleteUser: async () => {} }),
    HttpsError, Timestamp, FieldPath, onCall: callback => callback, onRequest: (_options, callback) => callback, z, auditLog: () => {}
  };
  const raw = readFileSync('functions/src/privacy-execution.ts', 'utf8');
  const source = raw.replace(/^import[\s\S]*?from "[^"]+";\n/gm, '');
  const prelude = `import { createHash } from 'node:crypto'; const { getApps, initializeApp, getFirestore, getStorage, getAuth, HttpsError, Timestamp, FieldPath, onCall, onRequest, z, auditLog } = globalThis[${JSON.stringify(key)}];\n`;
  try { return await import(`data:text/javascript;base64,${Buffer.from(prelude + stripTypeScriptTypes(source) + '\n//# sourceURL=storytime-private-version-privacy-fixture.mjs').toString('base64')}`); }
  finally { delete globalThis[key]; }
}

const ownerRequest = data => ({ auth: { uid: 'owner', token: { email_verified: true } }, data });
const adminRequest = data => ({ auth: { uid: 'admin', token: { admin: true } }, data });
function request(f, type, scope) {
  f.put('privacyRequests/privacy', { schemaVersion: 'storytime-privacy-request-v1', confirmation: true,
    createdAt: new Date(Date.now() - 1000).toISOString(), status: 'requested',
    exportAuthorizationExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: 'owner', type, scope, sessionId: scope === 'story_session' ? 'session' : null });
}

for (const scope of ['account', 'story_session']) {
  test(`${scope} export includes only owner-scoped private story versions`, async () => {
    const f = fixture(); const c = await callables(f); request(f, 'export', scope);
    await c.processStorytimeExportRequest(ownerRequest({ privacyRequestId: 'privacy' }));
    const file = [...f.files.entries()].find(([path]) => path.endsWith('/storytime-export.json'));
    const data = JSON.parse(file[1]);
    assert.deepEqual(data.collections.storyVersions.map(row => row.id), ['version']);
    assert.equal(data.collections.storyVersions[0].snapshot.body, 'private previous memory');
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
