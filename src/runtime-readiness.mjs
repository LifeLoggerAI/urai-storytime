// URAI Storytime runtime readiness model
//
// This module provides one cohesive source for app-visible readiness status.
// It intentionally defaults production readiness to RED until external systems
// are verified with evidence.

export const RUNTIME_STATUS = Object.freeze({
  green: 'GREEN',
  yellow: 'YELLOW',
  red: 'RED',
});

export const RUNTIME_GATES = Object.freeze([
  {
    name: 'Local demo story flow',
    status: RUNTIME_STATUS.green,
    evidence: 'Deterministic local story generation and local persistence are implemented.',
  },
  {
    name: 'Firebase project',
    status: RUNTIME_STATUS.red,
    blocker: 'Firebase project ID and hosting target are not verified.',
  },
  {
    name: 'Authentication',
    status: RUNTIME_STATUS.red,
    blocker: 'Firebase Auth provider and adult ownership model are not live.',
  },
  {
    name: 'Firestore security rules',
    status: RUNTIME_STATUS.yellow,
    blocker: 'Deny-by-default baseline exists, but emulator tests and ownership rules are not complete.',
  },
  {
    name: 'Cloud persistence',
    status: RUNTIME_STATUS.red,
    blocker: 'Stories are local-only until Firebase, auth, and rules are verified.',
  },
  {
    name: 'Moderation',
    status: RUNTIME_STATUS.yellow,
    blocker: 'Local prompt precheck exists, but output moderation and review queues are not live.',
  },
  {
    name: 'Privacy operations',
    status: RUNTIME_STATUS.yellow,
    blocker: 'Export/deletion architecture exists, but verified backend jobs are not live.',
  },
  {
    name: 'Observability',
    status: RUNTIME_STATUS.yellow,
    blocker: 'Event model exists, but monitoring providers and alerts are not configured.',
  },
  {
    name: 'Production deployment',
    status: RUNTIME_STATUS.red,
    blocker: 'Production deploy target, smoke evidence, rollback evidence, and secrets are not verified.',
  },
]);

export function summarizeRuntimeReadiness(gates = RUNTIME_GATES) {
  const hasRed = gates.some((gate) => gate.status === RUNTIME_STATUS.red);
  const hasYellow = gates.some((gate) => gate.status === RUNTIME_STATUS.yellow);

  return {
    productionReady: !hasRed && !hasYellow,
    status: hasRed ? RUNTIME_STATUS.red : hasYellow ? RUNTIME_STATUS.yellow : RUNTIME_STATUS.green,
    gates,
  };
}
