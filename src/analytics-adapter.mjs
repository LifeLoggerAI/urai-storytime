export const ANALYTICS_STATUS = Object.freeze({
  providerConfigured: false,
  consentRequired: true,
  productionVerified: false,
});

export function createAnalyticsEvent(name, payload = {}) {
  return {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };
}

export function trackAnalyticsEvent(event, { consentGranted = false } = {}) {
  return {
    accepted: consentGranted,
    providerForwarded: false,
    reason: consentGranted
      ? 'Analytics provider not configured.'
      : 'Consent not granted.',
    event,
  };
}
