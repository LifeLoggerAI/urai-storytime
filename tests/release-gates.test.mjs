import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RELEASE_GATE_STATUS,
  createReleaseGate,
  evaluateProductionReadiness,
} from '../src/release-gates.mjs';

test('release gates normalize correctly', () => {
  const gate = createReleaseGate({
    name: 'Firestore rules verified',
    status: RELEASE_GATE_STATUS.red,
  });

  assert.equal(gate.name, 'Firestore rules verified');
  assert.equal(gate.status, RELEASE_GATE_STATUS.red);
});

test('production readiness blocks on red gates', () => {
  const result = evaluateProductionReadiness([
    createReleaseGate({
      name: 'Auth verified',
      status: RELEASE_GATE_STATUS.red,
    }),
  ]);

  assert.equal(result.productionReady, false);
  assert.equal(result.overallStatus, RELEASE_GATE_STATUS.red);
});

test('production readiness stays yellow until all gates are green', () => {
  const result = evaluateProductionReadiness([
    createReleaseGate({
      name: 'Monitoring configured',
      status: RELEASE_GATE_STATUS.yellow,
    }),
  ]);

  assert.equal(result.productionReady, false);
  assert.equal(result.overallStatus, RELEASE_GATE_STATUS.yellow);
});
