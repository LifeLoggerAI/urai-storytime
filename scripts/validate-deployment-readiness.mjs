#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'package.json',
  'firebase.json',
  '.firebaserc',
  'firestore.indexes.json',
  'storage.rules',
  'docs/FIREBASE_READINESS.md',
  'docs/DEPLOYMENT_RUNBOOK.md',
  'docs/ROLLBACK_RUNBOOK.md',
];

const failures = [];
const warnings = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    failures.push(`Missing required deployment file: ${file}`);
  }
}

const firebaseRcPath = path.join(root, '.firebaserc');
if (fs.existsSync(firebaseRcPath)) {
  const text = fs.readFileSync(firebaseRcPath, 'utf8');
  if (text.includes('REPLACE_WITH_URAI_STORYTIME_STAGING')) {
    warnings.push('Firebase project placeholder is still present. This is safe for scaffolding but blocks deployment.');
  }
}

const firebaseJsonPath = path.join(root, 'firebase.json');
if (fs.existsSync(firebaseJsonPath)) {
  const text = fs.readFileSync(firebaseJsonPath, 'utf8');
  if (!text.includes('"public": "dist"')) {
    failures.push('firebase.json must serve the built dist directory.');
  }
  if (!text.includes('X-Content-Type-Options')) {
    warnings.push('firebase.json is missing X-Content-Type-Options header.');
  }
}

if (warnings.length > 0) {
  console.warn('\nDeployment readiness warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (failures.length > 0) {
  console.error('\nDeployment readiness failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Deployment readiness scaffold check passed.');
if (warnings.length > 0) {
  console.log('Warnings remain and must be resolved before staging or production deployment.');
}
