import test from 'node:test';
import assert from 'node:assert/strict';

import { LIVE_PERSISTENCE_STATUS } from '../src/live-persistence-boundary.mjs';

test('live persistence remains blocked without verified Firebase runtime', () => {
  assert.equal(LIVE_PERSISTENCE_STATUS.productionVerified, false);
});

test('live persistence requires verified Firebase project evidence', () => {
  assert.equal(LIVE_PERSISTENCE_STATUS.requiresVerifiedFirebaseProject, true);
});
