import test from 'node:test';
import assert from 'node:assert/strict';

import { ANALYTICS_STATUS } from '../src/analytics-adapter.mjs';
import { MONITORING_STATUS } from '../src/monitoring-alerting.mjs';

test('analytics provider defaults to blocked production posture', () => {
  assert.equal(ANALYTICS_STATUS.productionVerified, false);
});

test('monitoring provider defaults to blocked production posture', () => {
  assert.equal(MONITORING_STATUS.productionVerified, false);
});
