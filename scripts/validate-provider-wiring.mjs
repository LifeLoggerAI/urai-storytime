const requiredProviders = [
  'analytics',
  'monitoring',
  'alerting',
];

const configured = {
  analytics: Boolean(process.env.URAI_ANALYTICS_PROVIDER),
  monitoring: Boolean(process.env.URAI_MONITORING_PROVIDER),
  alerting: Boolean(process.env.URAI_ALERTING_PROVIDER),
};

const missing = requiredProviders.filter((provider) => !configured[provider]);

if (missing.length > 0) {
  console.warn('Provider wiring incomplete:', missing);
  process.exitCode = 1;
} else {
  console.log('Provider wiring validation passed.');
}
