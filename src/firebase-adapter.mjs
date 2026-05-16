// URAI Storytime Firebase adapter scaffold
//
// This module intentionally does not initialize Firebase yet.
// It defines the boundary between the current local demo storage layer
// and the future cloud-backed implementation.

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
});

export function assertFirebaseReady(status = FIREBASE_READINESS_STATUS) {
  const missing = Object.entries(status)
    .filter(([, value]) => value !== true)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Firebase is not production-ready. Missing: ${missing.join(', ')}`);
  }

  return true;
}

export function createLocalOnlyPersistenceNotice() {
  return {
    mode: 'local-demo',
    cloudSyncEnabled: false,
    message: 'Stories are stored locally in this demo until Firebase auth, rules, and deployment targets are verified.',
  };
}
