import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';

const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { z } = require('zod');
let loadNumber = 0;

function fixture() {
  const records = new Map();
  const versions = new Map();
  const queryCalls = [];
  let nextId = 0;
  let beforeCommit;
  const snapshot = {
    title: 'A family story', provider: 'template', locale: 'en-US', audienceAgeBand: 'family',
    consentVersion: 'consent-v1', reviewVersion: 'review-v1', reviewedRequestSha256: 'a'.repeat(64),
    provenance: {}, chapter: { id: 'chapter', title: 'Chapter', summary: 'Original chapter' },
    moment: { id: 'moment', title: 'Moment', body: 'Original memory' },
    narrator: { id: 'narrator', text: 'Original narration' },
    emotionalArc: { id: 'arc', arcLabel: 'hopeful', summary: 'Hopeful' }
  };
  const put = (path, data) => {
    if (data === undefined) records.delete(path);
    else records.set(path, structuredClone(data));
    versions.set(path, (versions.get(path) ?? 0) + 1);
  };
  const read = path => {
    const data = records.get(path);
    return { id: path.split('/').at(-1), exists: data !== undefined, data: () => data === undefined ? undefined : structuredClone(data) };
  };
  const ref = path => ({ path, id: path.split('/').at(-1), get: async () => read(path) });
  const query = (name, filters = [], ordered = false, bound) => ({
    where: (key, op, value) => query(name, [...filters, [key, op, value]], ordered, bound),
    orderBy: (key, direction) => { queryCalls.push(['orderBy', key, direction]); return query(name, filters, [key, direction], bound); },
    limit: count => { queryCalls.push(['limit', count]); return query(name, filters, ordered, count); },
    get: async () => {
      queryCalls.push(['get', name, filters, bound]);
      let docs = [...records.keys()].filter(path => path.startsWith(`${name}/`) && filters.every(([key, , value]) => records.get(path)[key] === value)).map(read);
      if (ordered) docs.sort((a, b) => (b.data()[ordered[0]] ?? 0) - (a.data()[ordered[0]] ?? 0));
      if (bound !== undefined) docs = docs.slice(0, bound);
      return { docs };
    }
  });
  const collection = name => ({ ...query(name), doc: id => ref(`${name}/${id ?? `new-${++nextId}`}`) });
  function writes() {
    const staged = [];
    const writer = {
      create: (r, data) => { staged.push(['create', r.path, data]); return writer; },
      set: (r, data) => { staged.push(['set', r.path, data]); return writer; },
      update: (r, data) => { staged.push(['update', r.path, data]); return writer; },
      commit: async () => {
        for (const [kind, path] of staged) {
          if (kind === 'create' && records.has(path)) throw new Error('already exists');
          if (kind === 'update' && !records.has(path)) throw new Error('document not found');
        }
        for (const [kind, path, data] of staged) put(path, kind === 'update' ? { ...records.get(path), ...data } : data);
      }
    };
    return writer;
  }
  const db = {
    collection,
    batch: writes,
    runTransaction: async callback => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const readVersions = new Map();
        const writer = writes();
        const transaction = { ...writer, get: async r => {
          readVersions.set(r.path, versions.get(r.path) ?? 0);
          return read(r.path);
        } };
        const result = await callback(transaction);
        if (beforeCommit) { const hook = beforeCommit; beforeCommit = undefined; await hook(); }
        if ([...readVersions].some(([path, version]) => (versions.get(path) ?? 0) !== version)) continue;
        await writer.commit();
        return result;
      }
      throw new Error('contention exhausted');
    }
  };
  put('storySessions/session', { userId: 'owner', currentVersionId: 'version-1', versionNumber: 1 });
  put('storyVersions/version-1', { userId: 'owner', sessionId: 'session', schemaVersion: 'story-version-v1', status: 'committed', immutable: true, versionNumber: 1, snapshot });
  for (const [name, id] of [['storyChapters', 'chapter'], ['storyMoments', 'moment'], ['narratorScripts', 'narrator']]) put(`${name}/${id}`, { userId: 'owner', sessionId: 'session' });
  return { db, records, put, queryCalls, beforeCommit: hook => { beforeCommit = hook; } };
}

async function callables(f) {
  const key = `story-versioning-fixture-${++loadNumber}`;
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  globalThis[key] = { getApps: () => [{}], initializeApp: () => {}, getFirestore: () => f.db, HttpsError, onCall: callback => callback, z, auditLog: () => {}, STORY_VERSION_SCHEMA_VERSION: 'story-version-v1' };
  const raw = readFileSync('functions/src/story-versioning.ts', 'utf8');
  const source = raw.replace(/^import[\s\S]*?from "[^"]+";\n/gm, '');
  const prelude = `import { createHash } from 'node:crypto'; const { getApps, initializeApp, getFirestore, HttpsError, onCall, z, auditLog, STORY_VERSION_SCHEMA_VERSION } = globalThis[${JSON.stringify(key)}];\n`;
  try { return await import(`data:text/javascript;base64,${Buffer.from(prelude + stripTypeScriptTypes(source)).toString('base64')}`); }
  finally { delete globalThis[key]; }
}
const request = data => ({ auth: { uid: 'owner', token: { email_verified: true } }, data });
const edit = extra => request({ sessionId: 'session', expectedCurrentVersionId: 'version-1', title: 'Updated story', ...extra });

test('concurrent revisions accept exactly one current-version transition', async () => {
  const f = fixture(); const c = await callables(f);
  const results = await Promise.allSettled([c.saveStoryRevision(edit()), c.saveStoryRevision(edit({ title: 'Other edit' }))]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'aborted');
  assert.equal(f.records.get('storySessions/session').versionNumber, 2);
  assert.equal([...f.records.keys()].filter(path => path.startsWith('storyVersions/')).length, 2);
});
test('concurrent edit and restore cannot both commit from the same version', async () => {
  const f = fixture(); const c = await callables(f);
  const results = await Promise.allSettled([c.saveStoryRevision(edit()), c.restoreStoryVersion(request({ sessionId: 'session', expectedCurrentVersionId: 'version-1', targetVersionId: 'version-1' }))]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'aborted');
});
for (const [collection, child] of [['storyChapters', 'chapter'], ['storyMoments', 'moment'], ['narratorScripts', 'narrator']]) {
  test(`revision rejects a foreign ${collection} reference without partial writes`, async () => {
    const f = fixture(); const c = await callables(f);
    f.put(`${collection}/${child}`, { userId: 'other', sessionId: 'different-session' });
    const before = structuredClone([...f.records]);
    await assert.rejects(c.saveStoryRevision(edit()), error => error.code === 'permission-denied');
    assert.deepEqual([...f.records], before);
  });
}
test('deletion during a revision cannot resurrect session or story children', async () => {
  const f = fixture(); const c = await callables(f);
  f.beforeCommit(() => f.put('storySessions/session', undefined));
  await assert.rejects(c.saveStoryRevision(edit()), error => error.code === 'permission-denied');
  assert.equal(f.records.has('storySessions/session'), false);
  assert.equal([...f.records.keys()].filter(path => path.startsWith('storyVersions/')).length, 1);
  assert.equal(f.records.get('storyMoments/moment').title, undefined);
});
test('ownership change during revision is rechecked before commit', async () => {
  const f = fixture(); const c = await callables(f);
  f.beforeCommit(() => f.put('storyMoments/moment', { userId: 'other', sessionId: 'different-session' }));
  await assert.rejects(c.saveStoryRevision(edit()), error => error.code === 'permission-denied');
  assert.equal(f.records.get('storySessions/session').versionNumber, 1);
});
test('restore also validates child ownership before writing', async () => {
  const f = fixture(); const c = await callables(f);
  f.put('narratorScripts/narrator', { userId: 'other', sessionId: 'different-session' });
  await assert.rejects(c.restoreStoryVersion(request({ sessionId: 'session', expectedCurrentVersionId: 'version-1', targetVersionId: 'version-1' })), error => error.code === 'permission-denied');
  assert.equal(f.records.get('storySessions/session').versionNumber, 1);
});
test('invalid or mismatched current version numbers fail closed', async () => {
  for (const value of [1.5, NaN, Number.MAX_SAFE_INTEGER, 2]) {
    const f = fixture(); const c = await callables(f);
    f.put('storySessions/session', { ...f.records.get('storySessions/session'), versionNumber: value });
    await assert.rejects(c.saveStoryRevision(edit()), error => error.code === 'failed-precondition');
    assert.equal([...f.records.keys()].filter(path => path.startsWith('storyVersions/')).length, 1);
  }
});
test('history read applies server ordering and a 25-version cap', async () => {
  const f = fixture(); const c = await callables(f);
  for (let i = 2; i <= 40; i++) f.put(`storyVersions/version-${i}`, { userId: 'owner', sessionId: 'session', versionNumber: i });
  const result = await c.listStoryVersions(request({ sessionId: 'session' }));
  assert.equal(result.versions.length, 25);
  assert.equal(result.versions[0].versionNumber, 40);
  assert.ok(f.queryCalls.some(call => call[0] === 'orderBy' && call[1] === 'versionNumber' && call[2] === 'desc'));
  assert.ok(f.queryCalls.some(call => call[0] === 'get' && call[3] === 25));
});
