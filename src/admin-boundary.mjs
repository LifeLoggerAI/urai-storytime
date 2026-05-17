export const ADMIN_ROLES = Object.freeze({
  owner: 'owner',
  admin: 'admin',
  moderator: 'moderator',
  support: 'support',
});

export const ADMIN_ACTIONS = Object.freeze({
  reviewModeration: 'reviewModeration',
  viewAuditLogs: 'viewAuditLogs',
  processExport: 'processExport',
  processDeletion: 'processDeletion',
  manageRelease: 'manageRelease',
});

const permissions = Object.freeze({
  [ADMIN_ROLES.owner]: Object.values(ADMIN_ACTIONS),
  [ADMIN_ROLES.admin]: [ADMIN_ACTIONS.reviewModeration, ADMIN_ACTIONS.viewAuditLogs, ADMIN_ACTIONS.manageRelease],
  [ADMIN_ROLES.moderator]: [ADMIN_ACTIONS.reviewModeration],
  [ADMIN_ROLES.support]: [ADMIN_ACTIONS.viewAuditLogs],
});

export function canPerformAdminAction(role, action) {
  return permissions[role]?.includes(action) === true;
}

export function assertAdminAction(role, action) {
  if (!canPerformAdminAction(role, action)) {
    throw new Error(`Admin action denied: ${action}`);
  }
  return true;
}
