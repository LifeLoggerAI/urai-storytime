export const MONITORING_STATUS = Object.freeze({
  crashReportingConfigured: false,
  uptimeMonitoringConfigured: false,
  alertRoutingConfigured: false,
  productionVerified: false,
});

export function createOperationalAlert({ severity = 'warning', system, message }) {
  return {
    id: crypto.randomUUID(),
    severity,
    system,
    message,
    createdAt: new Date().toISOString(),
    acknowledged: false,
  };
}

export function createProductionBlocker(message) {
  return createOperationalAlert({
    severity: 'critical',
    system: 'production-readiness',
    message,
  });
}
