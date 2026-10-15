import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve('.');

// Executes the mounted component source with controlled Auth, SDK and React
// boundaries. This is supplemental source evidence, not cloud/browser proof.
function fixture() {
  const docs = new Map();
  const auth = { currentUser: null };
  const reads = [];
  const changes = [];
  let callback, effect, cleanup, state, initialized = false;
  const hooks = { beforeGet: null, beforeQuery: null };
  const put = (collection, id, data) => docs.set(`${collection}/${id}`, structuredClone(data));
  const snapshot = (collection, id) => ({
    id,
    exists: () => docs.has(`${collection}/${id}`),
    data: () => structuredClone(docs.get(`${collection}/${id}`)),
  });
  const sdk = {
    collection: (_db, name) => ({ name }),
    doc: (_db, name, id) => ({ name, id }),
    where: (field, op, value) => ({ field, op, value }),
    orderBy: () => ({}),
    query: (collection, ...conditions) => ({ ...collection, conditions }),
    getDoc: async ref => {
      reads.push(`${ref.name}/${ref.id}`);
      const result = snapshot(ref.name, ref.id);
      const captured = result.data();
      const existed = result.exists();
      await hooks.beforeGet?.(ref);
      return { ...result, exists: () => existed, data: () => structuredClone(captured) };
    },
    getDocs: async query => {
      reads.push(query.name);
      await hooks.beforeQuery?.(query);
      return { docs: [...docs].filter(([key, data]) => key.startsWith(`${query.name}/`)
        && query.conditions.every(condition => !condition.field || data[condition.field] === condition.value))
        .map(([key]) => snapshot(query.name, key.split('/')[1])) };
    },
  };
  const stubs = {
    'firebase/auth': { onAuthStateChanged: (_auth, listener) => { callback = listener; return () => { callback = null; }; } },
    'firebase/firestore': sdk,
    react: {
      useEffect: fn => { if (!effect) effect = fn; },
      useState: initial => {
        if (!initialized) { state = initial(); initialized = true; }
        return [state, next => { state = next; changes.push(next); }];
      },
    },
    'react/jsx-runtime': { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) },
    '@/lib/firebase/client': { getFirebaseAuth: () => auth, getFirebaseDb: () => ({}), isStorytimeCloudModeEnabled: () => true },
  };
  function compile(file) {
    const source = fs.readFileSync(file, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const module = { exports: {} };
    const sourceRequire = name => {
      if (stubs[name]) return stubs[name];
      if (name.startsWith('@/lib/')) return compile(path.join(root, 'src', name.slice(2) + '.ts'));
      if (name.startsWith('./')) return { [name.slice(2)]: name.slice(2) };
      return require(name);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: sourceRequire, console });
    return module.exports;
  }
  const component = compile(process.env.STORYTIME_CLOUD_COMPONENT_SOURCE
    ?? path.join(root, 'src/components/storytime/CloudSession.tsx')).CloudSession;
  const render = (sessionId = 'session') => component({ sessionId });
  render();
  cleanup = effect();
  return {
    put, docs, auth, reads, changes, hooks, render,
    get state() { return state; },
    notify: user => { auth.currentUser = user; return callback(user); },
    dispose: () => cleanup(),
  };
}

function story(f, userId = 'owner', sessionId = 'session') {
  const base = { userId, sessionId };
  f.put('storySessions', sessionId, { id: 'forged-stored-session-id', userId, title: 'Current story',
    chapterIds: ['chapter'], narratorScriptIds: ['script'], currentVersionId: 'version', versionNumber: 2,
    updatedAt: 'current', consentSnapshot: { voiceover: false }, emotionalArcSummaryId: 'arc' });
  // Deliberately place retired records before the current records. SDK query
  // ordering of narrator/scripts/scenes does not convey selection authority.
  f.put('storyChapters', 'retired-chapter', { ...base, id: 'retired-chapter', title: 'Retired chapter', summary: 'Old', momentIds: ['retired-moment'], narratorScriptId: 'retired-script' });
  f.put('storyMoments', 'retired-moment', { ...base, id: 'retired-moment', chapterId: 'retired-chapter', title: 'Retired moment', body: 'Old', memorySceneId: 'retired-scene' });
  f.put('narratorScripts', 'retired-script', { ...base, id: 'retired-script', chapterId: 'retired-chapter', text: 'Retired narration' });
  f.put('memoryScenes', 'retired-scene', { ...base, id: 'retired-scene', momentId: 'retired-moment', title: 'Retired scene' });
  f.put('storyChapters', 'chapter', { ...base, id: 'forged-stored-chapter-id', title: 'Current chapter', summary: 'Current summary', momentIds: ['moment'], narratorScriptId: 'script' });
  f.put('storyMoments', 'moment', { ...base, id: 'forged-stored-moment-id', chapterId: 'chapter', title: 'Current moment', body: 'Current body', memorySceneId: 'scene' });
  f.put('narratorScripts', 'script', { ...base, id: 'forged-stored-script-id', chapterId: 'chapter', text: 'Current narration' });
  f.put('memoryScenes', 'scene', { ...base, id: 'forged-stored-scene-id', momentId: 'moment', title: 'Current scene' });
  f.put('emotionalArcSummaries', 'arc', { ...base, id: 'forged-stored-arc-id' });
  f.put('storyVersions', 'version', { ...base, id: 'forged-stored-version-id', schemaVersion: 'story-version-v1', versionNumber: 2,
    status: 'committed', immutable: true, snapshot: {
      title: 'Current story', chapter: { id: 'chapter', title: 'Current chapter', summary: 'Current summary' },
      moment: { id: 'moment', title: 'Current moment', body: 'Current body' },
      narrator: { id: 'script', text: 'Current narration' },
    } });
}

function find(tree, type) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.type === type) return tree;
  const children = tree.props?.children;
  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    const result = find(child, type);
    if (result) return result;
  }
  return null;
}

function pause() {
  let release;
  const promise = new Promise(resolve => { release = resolve; });
  return { promise, release };
}

test('mounted editor and memory scene resolve current immutable IDs, never array position or stored id', async () => {
  const f = fixture(); story(f);
  await f.notify({ uid: 'owner' });
  const tree = f.render();
  const editor = find(tree, 'StoryRevisionEditor');
  assert.ok(editor);
  assert.equal(editor.props.session.id, 'session');
  assert.equal(editor.props.chapter?.id, 'chapter');
  assert.equal(editor.props.moment?.id, 'moment');
  assert.equal(editor.props.narrator?.id, 'script');
  assert.equal(editor.props.narrator?.text, 'Current narration');
  assert.equal(find(tree, 'MemorySceneCard')?.props.scene.id, 'scene');
});

for (const absent of ['storyVersions/version', 'storyChapters/chapter', 'storyMoments/moment', 'narratorScripts/script']) {
  test(`mounted editor refuses a missing ${absent} without replacing it with retired data`, async () => {
    const f = fixture(); story(f); f.docs.delete(absent);
    await f.notify({ uid: 'owner' });
    const editor = find(f.render(), 'StoryRevisionEditor');
    assert.ok(editor);
    assert.equal(editor.props.chapter, null);
    assert.equal(editor.props.moment, null);
    assert.equal(editor.props.narrator, null);
    assert.equal(find(f.render(), 'MemorySceneCard'), null);
  });
}

for (const [record, changes] of [
  ['storyChapters/chapter', { userId: 'foreign' }],
  ['storyMoments/moment', { chapterId: 'other-chapter' }],
  ['narratorScripts/script', { chapterId: 'other-chapter' }],
  ['narratorScripts/script', { text: 'Newer unbound narration' }],
  ['storyVersions/version', { immutable: false }],
  ['storyVersions/version', { status: 'pending' }],
  ['storyVersions/version', { versionNumber: 1 }],
]) {
  test(`mounted editor denies ${record} mismatched ${Object.keys(changes).join(',')}`, async () => {
    const f = fixture(); story(f); f.docs.set(record, { ...f.docs.get(record), ...changes });
    await f.notify({ uid: 'owner' });
    const editor = find(f.render(), 'StoryRevisionEditor');
    assert.ok(editor);
    assert.equal(editor.props.narrator, null);
  });
}

test('a missing selected scene never displays another memory scene', async () => {
  const f = fixture(); story(f); f.docs.delete('memoryScenes/scene');
  await f.notify({ uid: 'owner' });
  assert.equal(find(f.render(), 'MemorySceneCard'), null);
});

test('unmounted private bundle completion cannot update component state', async () => {
  const f = fixture(); story(f); const gate = pause();
  f.hooks.beforeGet = () => gate.promise;
  const pending = f.notify({ uid: 'owner' });
  f.dispose(); gate.release(); await pending;
  assert.notEqual(f.state.status, 'ready');
});

for (const next of ['signed-out', 'other-user', 'same-uid-new-session']) {
  test(`late private read is discarded after ${next}`, async () => {
    const f = fixture(); story(f); const gate = pause(); let held = false;
    f.hooks.beforeGet = () => { if (!held) { held = true; return gate.promise; } };
    const user = { uid: 'owner' };
    const pending = f.notify(user);
    await f.notify(next === 'signed-out' ? null : { uid: next === 'other-user' ? 'foreign' : 'owner' });
    const changesAfterCurrent = f.changes.length;
    gate.release(); await pending;
    assert.equal(f.changes.length, changesAfterCurrent, 'a stale callback cannot publish any additional state');
    const previousReady = f.changes.filter(change => change.status === 'ready' && change.user === user);
    assert.equal(previousReady.length, 0);
    if (next === 'signed-out') assert.equal(f.state.status, 'signedOut');
    if (next === 'other-user') assert.notEqual(f.state.status, 'ready');
  });
}

test('prior private pixels disappear immediately when current Auth object changes before its callback', async () => {
  const f = fixture(); story(f); await f.notify({ uid: 'owner' });
  assert.ok(find(f.render(), 'StoryPlayer'));
  f.auth.currentUser = { uid: 'owner' };
  assert.equal(find(f.render(), 'StoryPlayer'), null);
});

test('prior memory pixels disappear on a new route before the next effect runs', async () => {
  const f = fixture(); story(f); await f.notify({ uid: 'owner' });
  assert.equal(find(f.render('other-memory'), 'StoryPlayer'), null);
});

test('withdrawal during session read stops subsequent private queries', async () => {
  const f = fixture(); story(f);
  f.hooks.beforeGet = () => { f.auth.currentUser = null; };
  await f.notify({ uid: 'owner' });
  assert.deepEqual(f.reads, ['storySessions/session']);
  assert.notEqual(f.state.status, 'ready');
});

test('changed parent version during child reads never delivers a mixed immutable baseline', async () => {
  const f = fixture(); story(f);
  f.hooks.beforeQuery = () => {
    const parent = f.docs.get('storySessions/session');
    f.docs.set('storySessions/session', { ...parent, currentVersionId: 'successor', updatedAt: 'successor' });
  };
  await f.notify({ uid: 'owner' });
  assert.notEqual(f.state.status, 'ready');
});

test('every actual private bundle query carries both selected session and current owner', async () => {
  const f = fixture(); story(f); const queries = [];
  f.hooks.beforeQuery = value => queries.push(value);
  await f.notify({ uid: 'owner' });
  assert.equal(queries.length, 5);
  for (const query of queries) {
    assert.ok(query.conditions.some(condition => condition.field === 'userId' && condition.value === 'owner'));
    assert.ok(query.conditions.some(condition => condition.field === 'sessionId' && condition.value === 'session'));
  }
  assert.equal(find(f.render(), 'StoryPlayer').props.chapters.length, 1);
});
