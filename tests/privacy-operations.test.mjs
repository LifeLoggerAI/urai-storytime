import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PRIVACY_REQUEST_TYPES,
  PRIVACY_REQUEST_STATUS,
  createPrivacyRequest,
  assertPrivacyOperationsReady,
  canRequestFamilyPrivacyAction,
} from '../src/privacy-operations.mjs';

test('privacy export requests are normalized', () => {
  const request = createPrivacyRequest({
    type: PRIVACY_REQUEST_TYPES.export,
    userId: 'user-1',
  });

  assert.equal(request.type, PRIVACY_REQUEST_TYPES.export);
  assert.equal(request.status, PRIVACY_REQUEST_STATUS.requested);
  assert.equal(request.userId, 'user-1');
});

test('privacy readiness fails while systems are incomplete', () => {
  assert.throws(() => {
    assertPrivacyOperationsReady({
      authReady: false,
      ownershipReady: false,
      auditReady: false,
    });
  }, /not ready/i);
});

test('guardians can request family privacy actions', () => {
  const user = { id: 'guardian-1' };

  const family = {
    members: {
      'guardian-1': { role: 'guardian' },
    },
  };

  assert.equal(canRequestFamilyPrivacyAction(user, family), true);
});
