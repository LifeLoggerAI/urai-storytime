import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const projectId = 'urai-storytime-public-share-rules-test';
let testEnv;

before(async () => {
  const rules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => testEnv.cleanup());

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

function publicShare(overrides = {}) {
  return {
    schemaVersion: 'public-story-share-v2',
    slug: 'safe-story-abcd1234',
    title: 'A safe story',
    safeSummary: 'A public-safe summary.',
    safeBody: 'A public-safe body.',
    revoked: false,
    createdAt: Timestamp.fromMillis(Date.now() - 60_000),
    updatedAt: Timestamp.fromMillis(Date.now() - 60_000),
    expiresAt: Timestamp.fromMillis(Date.now() + 60 * 60_000),
    ...overrides,
  };
}

test('anonymous users can read only active v2 public-safe derivatives', async () => {
  await seed('publicStoryShares/safe-story-abcd1234', publicShare());
  const anonymous = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(anonymous, 'publicStoryShares/safe-story-abcd1234')));
});

test('revoked, expired, malformed and legacy-leaking shares fail closed', async () => {
  await Promise.all([
    seed('publicStoryShares/revoked-story', publicShare({ slug: 'revoked-story', revoked: true })),
    seed('publicStoryShares/expired-story', publicShare({ slug: 'expired-story', expiresAt: Timestamp.fromMillis(Date.now() - 60_000) })),
    seed('publicStoryShares/missing-expiry', (() => {
      const value = publicShare({ slug: 'missing-expiry' });
      delete value.expiresAt;
      return value;
    })()),
    seed('publicStoryShares/legacy-owner-leak', publicShare({ slug: 'legacy-owner-leak', userId: 'alice', sessionId: 'session-a' })),
    seed('publicStoryShares/wrong-schema', publicShare({ slug: 'wrong-schema', schemaVersion: 'public-story-share-v1' })),
  ]);

  const anonymous = testEnv.unauthenticatedContext().firestore();
  for (const id of ['revoked-story', 'expired-story', 'missing-expiry', 'legacy-owner-leak', 'wrong-schema']) {
    await assertFails(getDoc(doc(anonymous, `publicStoryShares/${id}`)));
  }
});

test('all public-share client writes are denied', async () => {
  await seed('publicStoryShares/safe-story-abcd1234', publicShare());
  const owner = testEnv.authenticatedContext('alice').firestore();

  await assertFails(setDoc(doc(owner, 'publicStoryShares/client-created'), publicShare({ slug: 'client-created' })));
  await assertFails(updateDoc(doc(owner, 'publicStoryShares/safe-story-abcd1234'), { revoked: true }));
  await assertFails(deleteDoc(doc(owner, 'publicStoryShares/safe-story-abcd1234')));
});

test('private owner controls are owner-readable and never client-writable', async () => {
  await seed('publicStoryShareControls/safe-story-abcd1234', {
    schemaVersion: 'public-story-share-control-v1',
    userId: 'alice',
    sessionId: 'session-a',
    revoked: false,
    expiresAt: Timestamp.fromMillis(Date.now() + 60 * 60_000),
  });

  const alice = testEnv.authenticatedContext('alice').firestore();
  const bob = testEnv.authenticatedContext('bob').firestore();
  const anonymous = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(alice, 'publicStoryShareControls/safe-story-abcd1234')));
  await assertFails(getDoc(doc(bob, 'publicStoryShareControls/safe-story-abcd1234')));
  await assertFails(getDoc(doc(anonymous, 'publicStoryShareControls/safe-story-abcd1234')));
  await assertFails(updateDoc(doc(alice, 'publicStoryShareControls/safe-story-abcd1234'), { revoked: true }));
  await assertFails(deleteDoc(doc(alice, 'publicStoryShareControls/safe-story-abcd1234')));
  await assertFails(setDoc(doc(alice, 'publicStoryShareControls/client-created'), {
    userId: 'alice',
    sessionId: 'session-a',
    revoked: false,
  }));
});
