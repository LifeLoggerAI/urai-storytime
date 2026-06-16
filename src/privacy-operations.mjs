// URAI Storytime privacy operations boundary
//
// This module defines export and deletion request shapes before cloud
// implementation. It is intentionally not wired to Firebase yet.

export const PRIVACY_REQUEST_TYPES = Object.freeze({
  export: 'export',
  deletion: 'deletion',
});

export const PRIVACY_REQUEST_STATUS = Object.freeze({
  requested: 'requested',
  verified: 'verified',
  processing: 'processing',
  completed: 'completed',
  rejected: 'rejected',
});

export function createPrivacyRequest({ type, userId, familyId = null, childProfileId = null, reason = '' } = {}) {
  if (!Object.values(PRIVACY_REQUEST_TYPES).includes(type)) {
    throw new Error('Valid privacy request type is required.');
  }

  if (!userId) {
    throw new Error('User id is required for privacy requests.');
  }

  const now = new Date().toISOString();

  return {
    id: `${type}-${now}`,
    type,
    status: PRIVACY_REQUEST_STATUS.requested,
    userId,
    familyId,
    childProfileId,
    reason,
    createdAt: now,
    updatedAt: now,
  };
}

export function assertPrivacyOperationsReady({ authReady = false, ownershipReady = false, auditReady = false } = {}) {
  const missing = [];

  if (!authReady) missing.push('authReady');
  if (!ownershipReady) missing.push('ownershipReady');
  if (!auditReady) missing.push('auditReady');

  if (missing.length > 0) {
    throw new Error(`Privacy operations are not ready. Missing: ${missing.join(', ')}`);
  }

  return true;
}

export function canRequestFamilyPrivacyAction(user, family) {
  if (!user || !family) {
    return false;
  }

  const role = family.members?.[user.id]?.role;
  return role === 'owner' || role === 'guardian';
}
