#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function readRequired(filePath) {
  const absolutePath = path.join(root, filePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required rules file: ${filePath}`);
    return '';
  }

  return fs.readFileSync(absolutePath, 'utf8');
}

const firestoreRules = readRequired('firestore.rules');
const storageRules = readRequired('storage.rules');

if (firestoreRules) {
  if (!firestoreRules.includes("match /{document=**}")) {
    failures.push('Firestore rules must include a fallback match for all documents.');
  }

  if (!firestoreRules.includes('allow read, write: if false')) {
    failures.push('Firestore rules must include deny-by-default access.');
  }

  if (!firestoreRules.includes('request.auth.uid == userId')) {
    failures.push('Firestore user document access must be scoped to the authenticated user.');
  }
}

if (storageRules) {
  if (!storageRules.includes('allow read, write: if false')) {
    failures.push('Storage rules must deny access by default until ownership rules are verified.');
  }
}

if (failures.length > 0) {
  console.error('\nSecurity rules validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Static security rules validation passed.');
console.log('Emulator tests are still required before production deployment.');
