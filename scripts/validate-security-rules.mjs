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

function requireRule(source, snippet, message) {
  if (!source.includes(snippet)) {
    failures.push(message);
  }
}

const firestoreRules = readRequired('firestore.rules');
const storageRules = readRequired('storage.rules');

const requiredStorytimeCollections = [
  'storySessions',
  'storyChapters',
  'storyMoments',
  'memoryScenes',
  'narratorScripts',
  'ritualStorycards',
  'userStoryPreferences',
  'storyExports',
  'voiceoverJobs',
  'timelineReplayEvents',
  'emotionalArcSummaries',
  'relationshipStoryThreads',
  'weeklyStoryScrolls',
  'monthlyStoryScrolls',
  'storyAnalyticsEvents',
  'publicStoryShares'
];

if (firestoreRules) {
  requireRule(firestoreRules, 'match /{document=**}', 'Firestore rules must include a fallback match for all documents.');
  requireRule(firestoreRules, 'allow read, write: if false', 'Firestore rules must include deny-by-default access.');
  requireRule(firestoreRules, 'request.auth.uid == userId', 'Firestore user document access must be scoped to the authenticated user.');
  requireRule(firestoreRules, 'function ownerOnlyCreate()', 'Firestore rules must define owner-only create helper.');
  requireRule(firestoreRules, 'function ownerOnlyReadWrite(userId)', 'Firestore rules must define owner-only read/write helper.');
  requireRule(firestoreRules, 'resource.data.revoked == false', 'Public Storytime shares must only be readable when not revoked.');
  requireRule(firestoreRules, 'allow update, delete: if false', 'Append-only Storytime event collections must forbid mutation where required.');

  for (const collectionName of requiredStorytimeCollections) {
    requireRule(
      firestoreRules,
      `match /${collectionName}/{id}`,
      `Firestore rules must cover Storytime collection: ${collectionName}`
    );
  }
}

if (storageRules) {
  requireRule(storageRules, 'allow read, write: if false', 'Storage rules must deny access by default until ownership rules are verified.');
}

if (failures.length > 0) {
  console.error('\nSecurity rules validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Static security rules validation passed.');
console.log('Storytime collection rule coverage is present.');
console.log('Emulator tests are still required before production deployment.');
