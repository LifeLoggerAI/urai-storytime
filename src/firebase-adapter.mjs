// URAI Storytime Firebase adapter boundary
//
// This module centralizes Firebase readiness, configuration shape, and
// collection naming. It deliberately refuses live initialization until a
// verified project/config is passed in by a future Firebase SDK integration.

export const FIREBASE_READINESS_STATUS = Object.freeze({
  projectVerified: false,
  authVerified: false,
  firestoreRulesVerified: false,
  storageRulesVerified: false,
  deployTargetVerified: false,
});

export const STORYTIME_COLLECTIONS = Object.freeze({
  users: 'users',
  families: 'families',
  childProfiles: 'childProfiles',
  // Legacy names retained ONLY for old local-demo/import compatibility.
  // They are NOT approved cloud persistence endpoints.
  stories: 'stories',
  storyRuns: 'storyRuns',
  moderation: 'moderation',
  auditLogs: 'auditLogs',
  privacyRequests: 'privacyRequests',
});

// R1604: historical family-role collection names are exposed for compatibility
// with old local records, not as permission to enable cloud reads/writes.
// Explicitly reject any attempt to promote these paths to direct-client cloud
// access. Server-owned migration requires a separate reviewed API.
export const LEGACY_FAMILY_COLLECTIONS = Object.freeze(['stories', 'storyRuns']);
export const LEGACY_FAMILY_CLOUD_ACCESS = Object.freeze({
  status: 'denied',
  access: 'no-direct-client-read-or-write',
  migration: 'server-reviewed-only',
  localDemoPreserved: true,
});

export function assertLegacyFamilyCloudAccessDenied(collectionName) {
  if (LEGACY_FAMILY_COLLECTIONS.includes(collectionName)) {
    throw new Error('Legacy family story cloud access is disabled. Use a reviewed owner-scoped server API.');
  }
  return true;
}

export const REQUIRED_FIREBASE_CONFIG_KEYS = Object.freeze([
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]);

export function validateFirebaseConfig(config = {}) {
  const missing = REQUIRED_FIREBASE_CONFIG_KEYS.filter((key) => !config[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

export function assertFirebaseReady(status = FIREBASE_READINESS_STATUS) {
  const missing = Object.entries(status)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Firebase is not production-ready. Missing: ${missing.join(', ')}`);
  }

  return true;
}

export function createFirebaseRuntime(config = {}, status = FIREBASE_READINESS_STATUS) {
  const configValidation = validateFirebaseConfig(config);

  return {
    mode: configValidation.valid ? 'configured-not-initialized' : 'unconfigured',
    configValid: configValidation.valid,
    missingConfig: configValidation.missing,
    readiness: status,
    collections: STORYTIME_COLLECTIONS,
    legacyFamilyCloudAccess: LEGACY_FAMILY_CLOUD_ACCESS,
    cloudSyncEnabled: false,
  };
}

export function createLocalOnlyPersistenceNotice() {
  return {
    mode: 'local-demo',
    cloudSyncEnabled: false,
    message: 'Stories are stored locally in this demo until Firebase auth, rules, and deployment targets are verified.',
  };
}
