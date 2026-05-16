const blockers = [];

const requiredEvidence = {
  firebaseProject: process.env.URAI_FIREBASE_PROJECT_ID,
  stagingTarget: process.env.URAI_FIREBASE_STAGING_TARGET,
  productionTarget: process.env.URAI_FIREBASE_PRODUCTION_TARGET,
  deployVerification: process.env.URAI_DEPLOY_VERIFIED,
  secretsVerification: process.env.URAI_SECRETS_VERIFIED,
  legalVerification: process.env.URAI_LEGAL_APPROVED,
  billingIntegration: process.env.URAI_BILLING_PROVIDER,
  smokeVerification: process.env.URAI_SMOKE_TEST_VERIFIED,
};

for (const [key, value] of Object.entries(requiredEvidence)) {
  if (!value) {
    blockers.push(key);
  }
}

if (blockers.length > 0) {
  console.error('Production evidence blockers:', blockers);
  process.exit(1);
}

console.log('Production evidence verification passed.');
