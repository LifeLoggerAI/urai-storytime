import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FIREBASE_READINESS_STATUS,
  STORYTIME_COLLECTIONS,
  assertFirebaseReady,
  createLocalOnlyPersistenceNotice,
} from '../src/firebase-adapter.mjs';

test('local persistence notice defaults to local demo mode', () => {
  const notice = createLocalOnlyPersistenceNotice();

  assert.equal(notice.mode, 'local-demo');
  assert.equal(notice.cloudSyncEnabled, false);
  assert.match(notice.message, /locally/i);
});

test('firebase readiness assertion fails when requirements are missing', () => {
  assert.throws(() => {
    assertFirebaseReady(FIREBASE_READINESS_STATUS);
  }, /not production-ready/i);
});

test('storytime collections contain canonical collection names', () => {
  assert.equal(STORYTIME_COLLECTIONS.users, 'users');
  assert.equal(STORYTIME_COLLECTIONS.stories, 'stories');
  assert.equal(STORYTIME_COLLECTIONS.auditLogs, 'auditLogs');
});
