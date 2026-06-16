const required = {
  URAI_PRODUCTION_URL: process.env.URAI_PRODUCTION_URL,
  URAI_SMOKE_TEST_VERIFIED: process.env.URAI_SMOKE_TEST_VERIFIED,
  URAI_SMOKE_TEST_EVIDENCE_URL: process.env.URAI_SMOKE_TEST_EVIDENCE_URL,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error('Production smoke verification blocked. Missing:', missing);
  process.exit(1);
}

console.log('Production smoke verification evidence present.');
