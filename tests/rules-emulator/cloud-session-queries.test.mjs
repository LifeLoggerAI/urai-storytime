import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as firestore from 'firebase/firestore';

const projectId = 'urai-storytime-authorization-rules-test';
const componentSource = process.env.STORYTIME_CLOUD_COMPONENT_SOURCE
  ?? new URL('../../src/components/storytime/CloudSession.tsx', import.meta.url);
const source = readFileSync(componentSource, 'utf8');
const start = source.indexOf('async function loadBundle(');
const end = source.indexOf('\nexport function CloudSession', start);
assert.ok(start >= 0 && end > start, 'execute the actual mounted private bundle loader');
const loader = stripTypeScriptTypes(source.slice(start, end), { mode: 'transform' });
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId, firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  });
});
beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await firestore.setDoc(firestore.doc(db, 'storySessions/session-a'), {
      userId: 'owner', chapterIds: ['current'], narratorScriptIds: ['current'], updatedAt: 'current',
      consentSnapshot: { voiceover: false },
    });
    for (const name of ['storyChapters', 'storyMoments', 'memoryScenes', 'narratorScripts', 'storyVersions']) {
      for (const [id, userId, sessionId] of [['current', 'owner', 'session-a'], ['foreign', 'foreign', 'session-a'], ['other-session', 'owner', 'session-b']]) {
        await firestore.setDoc(firestore.doc(db, name, id), { id: 'stored-id-is-not-authority', userId, sessionId, order: 1 });
      }
    }
  });
});
after(async () => testEnv.cleanup());

function actualLoader(db) {
  const module = { exports: {} };
  vm.runInNewContext(`${loader}\nmodule.exports = { loadBundle };`, {
    ...firestore, getFirebaseDb: () => db, module, console,
  });
  return module.exports.loadBundle;
}

test('actual mounted owner bundle loader succeeds through unchanged native Rules and excludes foreign/session neighbors', async () => {
  const loadBundle = actualLoader(testEnv.authenticatedContext('owner').firestore());
  const result = await loadBundle('session-a', 'owner', () => true);
  assert.ok(result);
  assert.equal(result.session.id, 'session-a');
  for (const field of ['chapters', 'moments', 'scenes', 'scripts', 'versions']) {
    assert.deepEqual(Array.from(result[field], row => row.id), ['current'], field);
    assert.ok(result[field].every(row => row.userId === 'owner' && row.sessionId === 'session-a'));
  }
});

for (const name of ['storyChapters', 'storyMoments', 'memoryScenes', 'narratorScripts']) {
  test(`unchanged native Rules deny the predecessor session-only ${name} query`, async () => {
    const db = testEnv.authenticatedContext('owner').firestore();
    await assertFails(firestore.getDocs(firestore.query(firestore.collection(db, name), firestore.where('sessionId', '==', 'session-a'))));
  });
}

for (const identity of ['foreign', null]) {
  test(`actual mounted private bundle loader denies ${identity ?? 'signed-out'} native caller`, async () => {
    const db = identity ? testEnv.authenticatedContext(identity).firestore() : testEnv.unauthenticatedContext().firestore();
    await assert.rejects(actualLoader(db)('session-a', identity ?? 'owner', () => true), error => error.code === 'permission-denied');
  });
}
