import test from 'node:test';
import assert from 'node:assert/strict';

import {
  OBSERVABILITY_EVENT_TYPES,
  createErrorEvent,
  createObservabilityEvent,
  assertObservabilityReady,
} from '../src/observability.mjs';

test('observability events are normalized', () => {
  const event = createObservabilityEvent({
    type: OBSERVABILITY_EVENT_TYPES.performance,
    name: 'story-generation-duration',
    metadata: {
      durationMs: 1200,
    },
  });

  assert.equal(event.type, OBSERVABILITY_EVENT_TYPES.performance);
  assert.equal(event.name, 'story-generation-duration');
});

test('error events normalize Error objects', () => {
  const event = createErrorEvent(new Error('Story generation failed'));

  assert.equal(event.type, OBSERVABILITY_EVENT_TYPES.error);
  assert.equal(event.severity, 'error');
});

test('observability readiness fails while systems are incomplete', () => {
  assert.throws(() => {
    assertObservabilityReady({
      errorLoggingReady: false,
      performanceReady: false,
      alertingReady: false,
    });
  }, /not ready/i);
});
