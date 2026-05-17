import test from 'node:test';
import assert from 'node:assert/strict';

import { createLivePersistence } from '../src/live-persistence.mjs';

test('live persistence remains disabled without verified Firebase runtime', () => {
  const persistence = createLivePersistence();

  assert.equal(persistence.enabled, false);
  assert.match(persistence.blocker, /blocked/i);
});

test('live persistence refuses writes while disabled', async () => {
  const persistence = createLivePersistence();

  await assert.rejects(() => persistence.saveStory({ title: 'Blocked' }), /not enabled/i);
});
