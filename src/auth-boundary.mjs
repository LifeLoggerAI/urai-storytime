// URAI Storytime auth boundary scaffold
//
// This module is intentionally not wired to Firebase Auth yet.
// It defines the minimum account/family ownership model required before
// the app can move from local demo mode to cloud-backed production mode.

export const AUTH_READINESS_STATUS = Object.freeze({
  providerVerified: false,
  adultAccountRequired: false,
  familyOwnershipVerified: false,
  childProfileAccessVerified: false,
  deletionFlowVerified: false,
  exportFlowVerified: false,
});

export const FAMILY_ROLES = Object.freeze({
  owner: 'owner',
  guardian: 'guardian',
  viewer: 'viewer',
});

export function assertAdultAccount(user) {
  if (!user || user.isAdult !== true) {
    throw new Error('Adult account verification is required before accessing family cloud features.');
  }

  return true;
}

export function canManageFamily(user, family) {
  if (!user || !family) {
    return false;
  }

  const role = family.members?.[user.id]?.role;
  return role === FAMILY_ROLES.owner || role === FAMILY_ROLES.guardian;
}

export function canViewChildProfile(user, family, childProfile) {
  if (!user || !family || !childProfile) {
    return false;
  }

  if (childProfile.familyId !== family.id) {
    return false;
  }

  const role = family.members?.[user.id]?.role;
  return role === FAMILY_ROLES.owner || role === FAMILY_ROLES.guardian || role === FAMILY_ROLES.viewer;
}
