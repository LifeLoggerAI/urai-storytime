import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

// Runs the actual mounted resume callback and rendered form against explicit
// React/Auth/Firestore doubles. No real family record or provider is accessed.
function fixture() {
  const auth = { currentUser: null };
  const docs = new Map();
  const states = [];
  let stateIndex = 0, effects = [], callback, cleanup;
  const hooks = { beforeRead: null };
  const writes = [];
  const stubs = {
    'firebase/auth': { onAuthStateChanged: (_auth, listener) => { callback = listener; return () => { callback = null; }; } },
    'firebase/firestore': {
      doc: (_db, collection, id) => ({ collection, id }),
      getDoc: async ref => {
        const captured = structuredClone(docs.get(ref.id));
        await hooks.beforeRead?.(ref);
        return { id: ref.id, exists: () => captured !== undefined, data: () => structuredClone(captured) };
      },
    },
    'firebase/functions': { httpsCallable: () => async () => { writes.push('unexpected callable'); throw new Error('No callable admitted by this resume fixture'); } },
    react: {
      useState: initial => {
        const index = stateIndex++;
        if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
        return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
      },
      useMemo: fn => fn(),
      useEffect: fn => { effects.push(fn); },
    },
    'react/jsx-runtime': { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) },
    '@/lib/firebase/client': {
      getFirebaseAuth: () => auth, getFirebaseDb: () => ({}), getFirebaseFunctions: () => ({}), isStorytimeCloudModeEnabled: () => true,
    },
  };
  const file = process.env.STORYTIME_HOME_COMPONENT_SOURCE ?? path.resolve('src/components/storytime/StorytimeHome.tsx');
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: name => stubs[name] ?? (name.startsWith('./') ? {} : require(name)),
    URLSearchParams, window: { location: { search: '?draft=private-draft' } }, console,
  });
  function render() { stateIndex = 0; effects = []; return module.exports.StorytimeHome(); }
  render(); cleanup = effects[0]();
  return { auth, docs, hooks, writes, render,
    notify: user => { auth.currentUser = user; return callback(user); },
    dispose: () => cleanup(),
  };
}

function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return null;
  if (predicate(tree)) return tree;
  const children = tree.props?.children;
  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    const result = find(child, predicate); if (result) return result;
  }
  return null;
}
function title(f) { return find(f.render(), item => item.type === 'input' && item.props.maxLength === 120)?.props.value; }
function sourceText(f) { return find(f.render(), item => item.type === 'textarea')?.props.value; }
function checkbox(f, text) {
  const label = find(f.render(), item => item.type === 'label' && JSON.stringify(item.props.children).includes(text));
  return find(label, item => item.type === 'input' && item.props.type === 'checkbox')?.props.checked;
}
function draft(userId = 'owner') { return { userId, schemaVersion: 'story-draft-v1', title: 'Private owner title', theme: 'Family', sourceText: 'Private owner memory', revision: 3, emotionalTone: 'calm', audienceAgeBand: 'family' }; }
function pause() { let release; const promise = new Promise(resolve => { release = resolve; }); return { promise, release }; }

test('current owner draft resumes into actual form without restoring generation/provider approval', async () => {
  const f = fixture(); f.docs.set('private-draft', draft());
  await f.notify({ uid: 'owner' });
  assert.equal(title(f), 'Private owner title'); assert.equal(sourceText(f), 'Private owner memory');
  assert.equal(checkbox(f, 'I consent to Storytime using'), false);
  assert.equal(checkbox(f, 'I consent to the configured'), false);
  assert.deepEqual(f.writes, []);
});

for (const transition of ['signout', 'other-account', 'same-uid-new-session']) {
  test(`late private draft read cannot repopulate the form after ${transition}`, async () => {
    const f = fixture(); f.docs.set('private-draft', draft()); const gate = pause(); let held = false;
    f.hooks.beforeRead = () => { if (!held) { held = true; return gate.promise; } };
    const pending = f.notify({ uid: 'owner' });
    f.docs.delete('private-draft');
    await f.notify(transition === 'signout' ? null : { uid: transition === 'other-account' ? 'foreign' : 'owner' });
    assert.equal(title(f), ''); assert.equal(sourceText(f), '');
    gate.release(); await pending;
    assert.equal(title(f), ''); assert.equal(sourceText(f), ''); assert.deepEqual(f.writes, []);
  });
}

test('a callback for an obsolete Auth object cannot publish a private draft even without a later callback', async () => {
  const f = fixture(); f.docs.set('private-draft', draft()); const gate = pause();
  f.hooks.beforeRead = () => gate.promise;
  const pending = f.notify({ uid: 'owner' }); f.auth.currentUser = { uid: 'foreign' };
  gate.release(); await pending;
  assert.equal(title(f), ''); assert.equal(sourceText(f), '');
});

test('foreign draft records remain unavailable even if a transport returns their data', async () => {
  const f = fixture(); f.docs.set('private-draft', draft('foreign')); await f.notify({ uid: 'owner' });
  assert.equal(title(f), ''); assert.equal(sourceText(f), ''); assert.deepEqual(f.writes, []);
});

test('unmounted private draft completion cannot repopulate the form', async () => {
  const f = fixture(); f.docs.set('private-draft', draft()); const gate = pause();
  f.hooks.beforeRead = () => gate.promise;
  const pending = f.notify({ uid: 'owner' }); f.dispose(); gate.release(); await pending;
  assert.equal(title(f), ''); assert.equal(sourceText(f), '');
});
