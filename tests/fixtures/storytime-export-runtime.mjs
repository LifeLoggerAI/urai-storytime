import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { Readable, Writable } from 'node:stream';

const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { z } = require('zod');
let moduleId = 0;

export async function exportRuntime({ body = 'synthetic private story' } = {}) {
  const f = { now: Date.now(), monotonic: 0, records: new Map(), files: new Map(), generations: new Map(),
    tokens: [], streams: 0, signedUrls: 0, nextId: 0, generation: 0, tokenRevoked: false };
  f.put = (path, value) => value === undefined ? f.records.delete(path) : f.records.set(path, structuredClone(value));
  const snapshot = path => ({ id: path.split('/').at(-1), exists: f.records.has(path), data: () => structuredClone(f.records.get(path)) });
  const ref = path => ({ path, id: path.split('/').at(-1), get: async () => snapshot(path), set: async value => f.put(path, value),
    update: async value => { assert.ok(f.records.has(path)); f.put(path, { ...f.records.get(path), ...value }); } });
  const query = (name, filters = [], limit = Infinity, cursor) => ({
    where: (field, operator, value) => query(name, [...filters, [field, operator, value]], limit, cursor),
    orderBy: () => query(name, filters, limit, cursor), limit: size => query(name, filters, size, cursor),
    startAfter: next => query(name, filters, limit, next.id),
    get: async () => {
      const docs = [...f.records.keys()].filter(path => path.startsWith(`${name}/`)).sort().map(snapshot).filter(doc =>
        (!cursor || doc.id > cursor) && filters.every(([field, operator, value]) => {
          const current = Array.isArray(field) ? field.reduce((row, key) => row?.[key], doc.data()) : doc.data()?.[field];
          if (operator === 'array-contains') return Array.isArray(current) && current.includes(value);
          if (operator === 'in') return value.includes(current);
          return current === value;
        })).slice(0, limit);
      return { docs, size: docs.length };
    }
  });
  f.db = { collection: name => ({ ...query(name), doc: id => ref(`${name}/${id ?? `new-${++f.nextId}`}`) }),
    runTransaction: async callback => {
      const writes = [];
      const result = await callback({ get: item => item.get(), update: (item, value) => writes.push(() => item.update(value)),
        create: (item, value) => writes.push(() => item.set(value)) });
      if (f.failCommit) throw new Error('synthetic audit commit failure');
      for (const write of writes) await write();
      return result;
    }
  };
  f.bucket = { file: (path, options) => ({
    save: async (data, config) => {
      const stored = { body: Buffer.from(data), config, generation: String(++f.generation) };
      f.files.set(path, stored); f.generations.set(`${path}:${stored.generation}`, stored);
    },
    getMetadata: async () => {
      const stored = f.files.get(path); if (!stored) throw new Error('object missing');
      if (f.onMetadata) { const callback = f.onMetadata; f.onMetadata = null; await callback(); }
      return [{ metadata: stored.config.metadata.metadata, generation: stored.generation, size: String(stored.body.length) }];
    },
    getSignedUrl: async () => { f.signedUrls++; throw new Error('Storage signed URL must never be used'); },
    createReadStream: () => {
      f.streams++;
      assert.ok(options?.generation, 'delivery must pin an exact Storage generation');
      const stored = f.generations.get(`${path}:${options.generation}`); assert.ok(stored);
      return Readable.from([stored.body]);
    }
  }) };
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  class Timestamp {}
  class FieldPath { constructor(...fields) { return fields; } static documentId() { return '__name__'; } }
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [f.now])); } static now() { return f.now; } }
  const auth = { getUser: async () => ({ uid: 'owner', emailVerified: true, disabled: false, metadata: {}, providerData: [] }),
    verifyIdToken: async (token, checkRevoked) => {
      f.tokens.push([token, checkRevoked]); assert.equal(checkRevoked, true);
      if (f.tokenRevoked || token === 'revoked') throw new Error('token revoked');
      return { uid: token === 'foreign' ? 'foreign' : 'owner', email_verified: token !== 'unverified' };
    } };
  f.auth = auth;
  const key = `storytime-export-runtime-${++moduleId}`;
  globalThis[key] = { getApps: () => [{ name: '[DEFAULT]', options: { projectId: 'urai-storytime-test' } }], initializeApp: () => {},
    getFirestore: () => f.db, getStorage: () => ({ bucket: () => f.bucket }), getAuth: () => auth,
    HttpsError, Timestamp, FieldPath, onCall: callback => callback, onRequest: (_options, callback) => callback,
    z, auditLog: () => {}, Clock, performance: { now: () => f.monotonic } };
  const prelude = `import { createHash } from 'node:crypto'; import { pipeline } from 'node:stream/promises'; import { Readable } from 'node:stream';
    const { getApps, initializeApp, getFirestore, getStorage, getAuth, HttpsError, Timestamp, FieldPath, onCall, onRequest, z, auditLog, Clock, performance } = globalThis[${JSON.stringify(key)}]; const Date = Clock;\n`;
  async function load(path) {
    const raw = readFileSync(path, 'utf8').replace(/^import[\s\S]*?from "[^"]+";\n/gm, '');
    return import(`data:text/javascript;base64,${Buffer.from(prelude + stripTypeScriptTypes(raw)).toString('base64')}`);
  }
  try { f.module = { ...await load('functions/src/privacy-execution.ts'), ...await load('functions/src/privacy-requests.ts') }; }
  finally { delete globalThis[key]; }
  f.owner = data => ({ auth: { uid: 'owner', token: { email_verified: true } }, data });
  f.put('users/owner', { profile: 'synthetic owner' });
  f.put('storySessions/session', { userId: 'owner', requestId: 'generation-a' });
  f.put('storyVersions/version', { userId: 'owner', sessionId: 'session', immutable: true, snapshot: { body } });
  f.grant = async (scope = 'account') => {
    const created = await f.module.requestPrivacyOperation(f.owner({ requestId: `export-${++f.nextId}-fixture`, type: 'export', scope,
      ...(scope === 'story_session' ? { sessionId: 'session' } : {}), confirmation: true }));
    f.requestId = created.privacyRequestId;
    await f.module.processStorytimeExportRequest(f.owner({ privacyRequestId: f.requestId }));
    return f.module.getStorytimeExportDownloadUrl(f.owner({ privacyRequestId: f.requestId }));
  };
  f.request = () => f.records.get(`privacyRequests/${f.requestId}`);
  f.changeRequest = value => f.put(`privacyRequests/${f.requestId}`, { ...f.request(), ...value });
  f.deliver = async (grant, token = 'valid') => {
    class Response extends Writable {
      constructor() { super(); this.statusCode = 200; this.headers = {}; this.chunks = []; this.denial = null; }
      set(name, value) { Object.assign(this.headers, typeof name === 'string' ? { [name]: value } : name); return this; }
      status(value) { this.statusCode = value; return this; }
      json(value) { this.denial = value; return this; }
      get headersSent() { return this.chunks.length > 0; }
      _write(chunk, _encoding, callback) {
        this.chunks.push(Buffer.from(chunk));
        if (this.chunks.length === 1 && f.onFirstWrite) f.onFirstWrite();
        callback();
      }
    }
    const response = new Response();
    await f.module.downloadStorytimeExportPackage({ method: 'GET', query: Object.fromEntries(new URL(grant.url).searchParams),
      get: name => name.toLowerCase() === 'authorization' && token ? `Bearer ${token}` : undefined }, response);
    return response;
  };
  return f;
}
