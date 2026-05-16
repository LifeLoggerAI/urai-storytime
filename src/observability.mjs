// URAI Storytime observability boundary
//
// This module defines structured event/error/performance payloads before
// production analytics, logging, and monitoring providers are wired.

export const OBSERVABILITY_EVENT_TYPES = Object.freeze({
  error: 'error',
  performance: 'performance',
  userAction: 'user-action',
  moderation: 'moderation',
  deployment: 'deployment',
});

export function createObservabilityEvent({ type, name, severity = 'info', metadata = {}, timestamp = null } = {}) {
  if (!Object.values(OBSERVABILITY_EVENT_TYPES).includes(type)) {
    throw new Error('Valid observability event type is required.');
  }

  if (!name) {
    throw new Error('Observability event name is required.');
  }

  return {
    type,
    name,
    severity,
    metadata,
    timestamp: timestamp || new Date().toISOString(),
  };
}

export function createErrorEvent(error, metadata = {}) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');

  return createObservabilityEvent({
    type: OBSERVABILITY_EVENT_TYPES.error,
    name: message,
    severity: 'error',
    metadata,
  });
}

export function assertObservabilityReady({ errorLoggingReady = false, performanceReady = false, alertingReady = false } = {}) {
  const missing = [];

  if (!errorLoggingReady) missing.push('errorLoggingReady');
  if (!performanceReady) missing.push('performanceReady');
  if (!alertingReady) missing.push('alertingReady');

  if (missing.length > 0) {
    throw new Error(`Observability is not ready. Missing: ${missing.join(', ')}`);
  }

  return true;
}
