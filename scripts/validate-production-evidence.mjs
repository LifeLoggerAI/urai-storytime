const requiredEvidence = {
  URAI_FIREBASE_PROJECT_ID: process.env.URAI_FIREBASE_PROJECT_ID,
  URAI_FIREBASE_STAGING_TARGET: process.env.URAI_FIREBASE_STAGING_TARGET,
  URAI_FIREBASE_PRODUCTION_TARGET: process.env.URAI_FIREBASE_PRODUCTION_TARGET,
  URAI_FIREBASE_AUTH_VERIFIED: process.env.URAI_FIREBASE_AUTH_VERIFIED,
  URAI_FIRESTORE_VERIFIED: process.env.URAI_FIRESTORE_VERIFIED,
  URAI_STORAGE_RULES_VERIFIED: process.env.URAI_STORAGE_RULES_VERIFIED,
  URAI_DEPLOY_VERIFIED: process.env.URAI_DEPLOY_VERIFIED,
  URAI_SECRETS_VERIFIED: process.env.URAI_SECRETS_VERIFIED,
  URAI_BILLING_PROVIDER: process.env.URAI_BILLING_PROVIDER,
  URAI_LEGAL_APPROVED: process.env.URAI_LEGAL_APPROVED,
  URAI_PRODUCTION_URL: process.env.URAI_PRODUCTION_URL,
  URAI_SMOKE_TEST_VERIFIED: process.env.URAI_SMOKE_TEST_VERIFIED,
  URAI_SMOKE_TEST_EVIDENCE_URL: process.env.URAI_SMOKE_TEST_EVIDENCE_URL,
};

const missing = Object.entries(requiredEvidence)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error('Production evidence verification blocked. Missing required evidence variables:');
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log('Production evidence verification passed.');
