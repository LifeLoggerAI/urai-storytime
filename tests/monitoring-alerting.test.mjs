import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MONITORING_STATUS,
  createOperationalAlert,
  createProductionBlocker,
} from '../src/monitoring-alerting.mjs';

test('monitoring remains blocked until production providers are configured', () => {
  assert.equal(MONITORING_STATUS.productionVerified, false);
  assert.equal(MONITORING_STATUS.alertRoutingConfigured, false);
});

test('operational alerts are normalized', () => {
  const alert = createOperationalAlert({
    severity: 'warning',
    system: 'storybook-runtime',
    message: 'Smoke validation pending.',
  });

  assert.equal(alert.severity, 'warning');
  assert.equal(alert.system, 'storybook-runtime');
  assert.equal(alert.acknowledged, false);
  assert.ok(alert.id);
  assert.ok(alert.createdAt);
});

test('production blockers are always critical severity', () => {
  const blocker = createProductionBlocker('Firebase production target unverified.');

  assert.equal(blocker.severity, 'critical');
  assert.equal(blocker.system, 'production-readiness');
  assert.match(blocker.message, /unverified/i);
});
