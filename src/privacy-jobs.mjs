export function createExportRequest({ userId, familyId }) {
  return {
    id: crypto.randomUUID(),
    type: 'export',
    userId,
    familyId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export function createDeletionRequest({ userId, familyId }) {
  return {
    id: crypto.randomUUID(),
    type: 'deletion',
    userId,
    familyId,
    status: 'pending-confirmation',
    createdAt: new Date().toISOString(),
  };
}
