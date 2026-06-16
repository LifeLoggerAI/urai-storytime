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
  stories: 'stories',
  storyRuns: 'storyRuns',
  moderation: 'moderation',
  auditLogs: 'auditLogs',
  privacyRequests: 'privacyRequests',
});

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
