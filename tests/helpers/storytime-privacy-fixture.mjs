import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';

const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { z } = require('zod');
const { Timestamp } = require('firebase-admin/firestore');
let moduleId = 0;

// Synthetic SDK boundary fixture: executes the real source handlers. This is
// contract evidence, not a loaded Functions emulator or production receipt.
export function fixture() {
  const records = new Map(), files = new Map(), versions = new Map(), generations = new Map();
  let nextId = 0, sequence = 0, authPresent = true;
  let authCreatedAt = '2026-10-01T00:00:00.000Z';
  const hooks = { failDelete: null, failStorage: 0, failAuth: 0, failReceipt: 0, beforeDeleteCommit: null, beforeStorageDelete: null,
    revokedOwner: false, revokedAdmin: false, adminRole: true, disabledOwner: false, disabledAdmin: false, ownerVerified: true,
    afterRead: null, beforeSave: null, afterUser: null, beforeCommit: null };
  const put = (path, value) => {
    sequence++;
    if (value === undefined) { records.delete(path); versions.delete(path); }
    else { records.set(path, structuredClone(value)); versions.set(path, new Timestamp(1000, sequence)); }
  };
  const ref = path => ({ path, id: path.split('/').at(-1), get: async () => { const result = snapshot(path); await hooks.afterRead?.(path); return result; },
    set: async value => {
      if (path.startsWith('privacyOperationReceipts/') && hooks.failReceipt-- > 0) throw new Error('synthetic receipt outage');
      put(path, value);
    }, update: async value => {
      assert.ok(records.has(path), 'update cannot recreate a missing record');
      put(path, { ...records.get(path), ...value });
    } });
  const snapshot = path => ({ id: path.split('/').at(-1), ref: ref(path), exists: records.has(path),
    updateTime: versions.get(path), data: () => structuredClone(records.get(path)) });
  const query = (name, filters = [], limit = Infinity, cursor) => ({
    queryIdentity: { name, filters, limit, cursor },
    where: (field, operator, value) => query(name, [...filters, [field, operator, value]], limit, cursor),
    orderBy: () => query(name, filters, limit, cursor), limit: size => query(name, filters, size, cursor),
    startAfter: next => query(name, filters, limit, next.id), get: async () => {
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
      return { delete: item => deletes.push(item.path), commit: async () => {
        if (hooks.beforeDeleteCommit) await hooks.beforeDeleteCommit(deletes.map(path => ({ path })));
        if (deletes.some(path => path.startsWith(`${hooks.failDelete}/`))) {
          hooks.failDelete = null; throw new Error('synthetic batch outage before atomic commit');
        }
        deletes.forEach(path => put(path, undefined));
      } };
    },
    runTransaction: async callback => {
      const reads = new Map(), writes = [], queries = [];
      const track = result => {
        for (const doc of result.docs ?? [result]) reads.set(doc.ref.path, doc.updateTime);
        return result;
      };
      const transaction = { get: async item => { const result = track(await item.get());
          if (item.queryIdentity) queries.push({ item, identity: JSON.stringify(result.docs.map(row => [row.ref.path, row.updateTime?.seconds, row.updateTime?.nanoseconds])) });
          return result; },
        getAll: async (...refs) => Promise.all(refs.map(async item => track(await item.get()))),
        update: (item, value) => writes.push({ type: 'update', path: item.path, apply: () => item.update(value) }),
        create: (item, value) => writes.push({ type: 'create', path: item.path, apply: () => item.set(value) }),
        delete: (item, precondition) => writes.push({ type: 'delete', path: item.path, precondition,
          apply: () => put(item.path, undefined) }) };
      const result = await callback(transaction);
      await hooks.beforeCommit?.(writes, reads);
      const deletes = writes.filter(item => item.type === 'delete');
      if (deletes.length && hooks.beforeDeleteCommit) await hooks.beforeDeleteCommit(deletes);
      if (deletes.some(item => item.path.startsWith(`${hooks.failDelete}/`))) {
        hooks.failDelete = null;
        throw new Error('synthetic transaction outage before atomic commit');
      }
      for (const [path, version] of reads) {
        const current = versions.get(path);
        if (version ? !current?.isEqual(version) : current !== undefined) throw new Error('synthetic transaction conflict');
      }
      for (const { item, identity } of queries) if (JSON.stringify((await item.get()).docs.map(row => [row.ref.path, row.updateTime?.seconds, row.updateTime?.nanoseconds])) !== identity) throw new Error('synthetic query conflict');
      for (const item of deletes) if (item.precondition?.lastUpdateTime
        && !versions.get(item.path)?.isEqual(item.precondition.lastUpdateTime)) throw new Error('synthetic delete precondition conflict');
      for (const write of writes) await write.apply();
      return result;
    }
  };
  const putFile = (path, body = '{}', generation) => {
    files.set(path, body); generations.set(path, String(generation ?? ++sequence));
  };
  const bucket = {
    getFiles: async ({ prefix }) => [[...files.keys()].filter(path => path.startsWith(prefix)).map(name => ({ name }))],
    file: (path, options = {}) => ({
      save: async body => { await hooks.beforeSave?.(path); putFile(path, body); },
      getMetadata: async () => {
        if (!files.has(path)) throw Object.assign(new Error('not found'), { code: 404 });
        return [{ generation: generations.get(path), size: String(Buffer.byteLength(files.get(path))) }];
      },
      delete: async deleteOptions => {
        if (hooks.beforeStorageDelete) await hooks.beforeStorageDelete(path);
        if (hooks.failStorage-- > 0) throw new Error('synthetic storage outage');
        if (!files.has(path) && deleteOptions.ignoreNotFound) return;
        if (deleteOptions.ifGenerationMatch && deleteOptions.ifGenerationMatch !== generations.get(path)) throw new Error('synthetic generation precondition conflict');
        if (options.generation && options.generation !== generations.get(path)) throw new Error('synthetic generation selection conflict');
        files.delete(path); generations.delete(path);
      }, getSignedUrl: async () => ['fixture-url']
    })
  };
  const auth = {
    verifyIdToken: async (token, checkRevoked) => {
      assert.equal(checkRevoked, true); const uid = token === 'synthetic-admin-token' ? 'admin' : token === 'synthetic-owner-token' ? 'owner' : null;
      if (!uid || (uid === 'admin' ? hooks.revokedAdmin : hooks.revokedOwner)) throw new Error('Synthetic revoked credential');
      return { uid, email_verified: true, admin: uid === 'admin' };
    },
    getUser: async (uid = 'owner') => {
      if (uid === 'admin') { const value = { uid, emailVerified: true, disabled: hooks.disabledAdmin, customClaims: { admin: hooks.adminRole }, metadata: {}, providerData: [] }; await hooks.afterUser?.(uid); return value; }
      if (!authPresent) throw Object.assign(new Error('missing'), { code: 'auth/user-not-found' });
      const value = { uid: 'owner', emailVerified: hooks.ownerVerified, disabled: hooks.disabledOwner, metadata: { creationTime: authCreatedAt }, providerData: [] }; await hooks.afterUser?.(uid); return value;
    }, deleteUser: async () => {
      if (hooks.failAuth-- > 0) throw new Error('synthetic auth outage');
      if (!authPresent) throw Object.assign(new Error('missing'), { code: 'auth/user-not-found' });
      authPresent = false;
    }
  };
  put('storySessions/session', { userId: 'owner', requestId: 'request', currentVersionId: 'version' });
  put('storyVersions/version', { userId: 'owner', sessionId: 'session', immutable: true, snapshot: { body: 'synthetic private memory' } });
  put('storyVersions/foreign', { userId: 'different-owner', sessionId: 'foreign-session', immutable: true, snapshot: { body: 'must not export' } });
  return { db, bucket, auth, records, files, put, putFile, hooks,
    replaceAuth: () => { authPresent = true; authCreatedAt = '2026-10-02T00:00:00.000Z'; } };
}

export async function callables(f) {
  const key = `storytime-privacy-contract-${++moduleId}`;
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  class FieldPath { constructor(...fields) { return fields; } static documentId() { return '__name__'; } }
  globalThis[key] = { getApps: () => [{}], initializeApp: () => {}, getFirestore: () => f.db,
    getStorage: () => ({ bucket: () => f.bucket }), getAuth: () => f.auth, HttpsError, Timestamp, FieldPath,
    onCall: callback => callback, onRequest: (_options, callback) => callback, z, auditLog: () => {} };
  const raw = readFileSync(process.env.STORYTIME_PRIVACY_CONTRACT_SOURCE ?? 'functions/src/privacy-execution.ts', 'utf8');
  const source = raw.replace(/^import[\s\S]*?from "[^"]+";\n/gm, '');
  const actor = readFileSync('functions/src/privacy-actor.ts', 'utf8').replace(/^import[\s\S]*?from "[^"]+";\n/gm, '');
  const prelude = `import { createHash } from 'node:crypto'; import { pipeline } from 'node:stream/promises'; import { Readable } from 'node:stream'; import { performance } from 'node:perf_hooks'; const { getApps, initializeApp, getFirestore, getStorage, getAuth, HttpsError, Timestamp, FieldPath, onCall, onRequest, z, auditLog } = globalThis[${JSON.stringify(key)}];\n`;
  try { return await import(`data:text/javascript;base64,${Buffer.from(prelude + stripTypeScriptTypes(actor) + '\n' + stripTypeScriptTypes(source) + '\n//# sourceURL=storytime-privacy-contract-fixture.mjs').toString('base64')}`); }
  finally { delete globalThis[key]; }
}
export const ownerRequest = data => ({ auth: { uid: 'owner', token: { email_verified: true } }, data,
  rawRequest: { get: header => header.toLowerCase() === 'authorization' ? 'Bearer synthetic-owner-token' : undefined } });
export const adminRequest = data => ({ auth: { uid: 'admin', token: { admin: true } }, data,
  rawRequest: { get: header => header.toLowerCase() === 'authorization' ? 'Bearer synthetic-admin-token' : undefined } });
export function request(f, type, scope) {
  f.put('privacyRequests/privacy', { schemaVersion: 'storytime-privacy-request-v1', confirmation: true,
    createdAt: new Date(Date.now() - 1000).toISOString(), status: 'requested',
    exportAuthorizationExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: 'owner', type, scope, sessionId: scope === 'story_session' ? 'session' : null });
}
