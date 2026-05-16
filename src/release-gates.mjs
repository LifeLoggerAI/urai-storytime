// URAI Storytime release gate evaluator
//
// This module intentionally defaults to a blocked production posture.

export const RELEASE_GATE_STATUS = Object.freeze({
  green: 'GREEN',
  yellow: 'YELLOW',
  red: 'RED',
});

export function createReleaseGate({ name, status = RELEASE_GATE_STATUS.red, evidence = null, blocker = null } = {}) {
  if (!name) {
    throw new Error('Release gate name is required.');
  }

  return {
    name,
    status,
    evidence,
    blocker,
  };
}

export function evaluateProductionReadiness(gates = []) {
  const normalized = Array.isArray(gates) ? gates : [];

  const hasRed = normalized.some((gate) => gate.status === RELEASE_GATE_STATUS.red);
  const hasYellow = normalized.some((gate) => gate.status === RELEASE_GATE_STATUS.yellow);

  return {
    productionReady: !hasRed && !hasYellow,
    overallStatus: hasRed
      ? RELEASE_GATE_STATUS.red
      : hasYellow
        ? RELEASE_GATE_STATUS.yellow
        : RELEASE_GATE_STATUS.green,
    gates: normalized,
  };
}
