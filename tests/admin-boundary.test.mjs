import test from 'node:test';
import assert from 'node:assert/strict';

import { ADMIN_SYSTEM_STATUS } from '../src/admin-system-status.mjs';

test('admin systems default to non-production verified state', () => {
  assert.equal(ADMIN_SYSTEM_STATUS.productionVerified, false);
});

test('admin systems require verified auth provider', () => {
  assert.equal(ADMIN_SYSTEM_STATUS.requiresVerifiedAuthProvider, true);
});
