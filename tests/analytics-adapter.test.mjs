import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANALYTICS_STATUS,
  createAnalyticsEvent,
  trackAnalyticsEvent,
} from '../src/analytics-adapter.mjs';

test('analytics remains unverified until a provider is configured and evidenced', () => {
  assert.equal(ANALYTICS_STATUS.providerConfigured, false);
  assert.equal(ANALYTICS_STATUS.productionVerified, false);
});

test('analytics events are normalized with timestamps', () => {
  const event = createAnalyticsEvent('story_created', { mode: 'local-demo' });

  assert.equal(event.name, 'story_created');
  assert.deepEqual(event.payload, { mode: 'local-demo' });
  assert.ok(event.timestamp);
});

test('analytics tracking is rejected without consent', () => {
  const event = createAnalyticsEvent('story_created');
  const result = trackAnalyticsEvent(event, { consentGranted: false });

  assert.equal(result.accepted, false);
  assert.equal(result.providerForwarded, false);
  assert.match(result.reason, /Consent not granted/i);
});

test('analytics tracking is accepted but not forwarded without provider wiring', () => {
  const event = createAnalyticsEvent('story_created');
  const result = trackAnalyticsEvent(event, { consentGranted: true });

  assert.equal(result.accepted, true);
  assert.equal(result.providerForwarded, false);
  assert.match(result.reason, /not configured/i);
});
