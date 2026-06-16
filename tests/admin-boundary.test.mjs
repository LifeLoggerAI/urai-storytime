import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADMIN_ROLES,
  ADMIN_ACTIONS,
  canPerformAdminAction,
} from '../src/admin-boundary.mjs';

test('owner role can manage release actions', () => {
  assert.equal(
    canPerformAdminAction(ADMIN_ROLES.owner, ADMIN_ACTIONS.manageRelease),
    true,
  );
});

test('moderator role cannot process deletion requests', () => {
  assert.equal(
    canPerformAdminAction(ADMIN_ROLES.moderator, ADMIN_ACTIONS.processDeletion),
    false,
  );
});
