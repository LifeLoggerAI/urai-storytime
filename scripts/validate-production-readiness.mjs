#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { summarizeRuntimeReadiness } from '../src/runtime-readiness.mjs';

const root = process.cwd();
const failures = [];
const warnings = [];

function exists(filePath) {
  return fs.existsSync(path.join(root, filePath));
}

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

const requiredFiles = [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'storage.rules',
  'src/runtime-readiness.mjs',
  'src/firebase-adapter.mjs',
  'src/auth-boundary.mjs',
  'src/moderation-boundary.mjs',
  'src/story-persistence.mjs',
  'src/privacy-operations.mjs',
  'src/observability.mjs',
  'docs/PRODUCTION_RELEASE_GATE.md',
  'docs/RELEASE_EVIDENCE_LOG.md',
  'docs/DEPLOYMENT_RUNBOOK.md',
  'docs/ROLLBACK_RUNBOOK.md',
];

for (const file of requiredFiles) {
  if (!exists(file)) {
    failures.push(`Missing production readiness artifact: ${file}`);
  }
}

if (exists('.firebaserc')) {
  const firebaserc = read('.firebaserc');
  if (firebaserc.includes('REPLACE_WITH_URAI_STORYTIME_STAGING')) {
    warnings.push('Firebase project placeholder remains in .firebaserc. Production deploy must stay blocked.');
  }
}

if (exists('docs/RELEASE_EVIDENCE_LOG.md')) {
  const evidenceLog = read('docs/RELEASE_EVIDENCE_LOG.md');
  if (evidenceLog.includes('NOT RUN')) {
    warnings.push('Release evidence log still contains NOT RUN checks. Production readiness is not proven.');
  }
}

const readiness = summarizeRuntimeReadiness();
if (readiness.productionReady) {
  console.log('Runtime readiness reports production-ready.');
} else {
  warnings.push(`Runtime readiness is ${readiness.status}. Production remains blocked by runtime gates.`);
}

if (failures.length > 0) {
  console.error('\nProduction readiness validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Production readiness scaffold validation passed.');
if (warnings.length > 0) {
  console.warn('\nProduction readiness warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
  console.warn('\nWarnings are expected until external Firebase/auth/deployment evidence is verified.');
}
