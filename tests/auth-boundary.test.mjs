import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FAMILY_ROLES,
  assertAdultAccount,
  canManageFamily,
  canViewChildProfile,
} from '../src/auth-boundary.mjs';

test('adult verification fails for non-adult users', () => {
  assert.throws(() => {
    assertAdultAccount({ isAdult: false });
  }, /Adult account verification/i);
});

test('family owners can manage family', () => {
  const user = { id: 'user-1' };
  const family = {
    members: {
      'user-1': { role: FAMILY_ROLES.owner },
    },
  };

  assert.equal(canManageFamily(user, family), true);
});

test('cross-family child profile access is denied', () => {
  const user = { id: 'user-1' };

  const family = {
    id: 'family-a',
    members: {
      'user-1': { role: FAMILY_ROLES.guardian },
    },
  };

  const childProfile = {
    familyId: 'family-b',
  };

  assert.equal(canViewChildProfile(user, family, childProfile), false);
});
