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

const requiredSourceFiles = [
  'README.md',
  'package.json',
  'firebase.json',
  '.firebaserc',
  '.env.example',
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules',
  '.github/workflows/urai-production-verify.yml',
  'scripts/urai-production-verify.mjs',
  'scripts/validate-env-template.mjs',
  'scripts/validate-security-rules.mjs',
  'scripts/validate-emulator-scaffold.mjs',
  'scripts/validate-emulator-runtime.mjs',
  'scripts/validate-provider-wiring.mjs',
  'scripts/validate-production-evidence.mjs',
  'scripts/validate-production-smoke.mjs',
  'scripts/validate-production-readiness.mjs',
  'src/runtime-readiness.mjs',
  'src/app/storytime/page.tsx',
  'src/app/storytime/[sessionId]/page.tsx',
  'src/app/share/story/[shareId]/page.tsx',
  'src/components/storytime/StorytimeHome.tsx',
  'src/components/storytime/CloudSession.tsx',
  'src/components/storytime/ShareStory.tsx',
  'src/components/storytime/ShareControls.tsx',
  'functions/package.json',
  'functions/src/index.ts',
  'functions/src/storytime.ts',
  'functions/src/story-provider.ts',
  'functions/src/public-story-share-lifecycle.ts',
  'functions/src/privacy-requests.ts',
  'functions/src/privacy-execution.ts',
  'functions/src/refresh-story-timeline.ts',
  'functions/src/rebuild-user-story-archive.ts',
  'functions/src/readiness.ts',
  'tests/e2e/smoke.test.mjs'
];

for (const file of requiredSourceFiles) {
  if (!exists(file)) failures.push(`Missing required Storytime source artifact: ${file}`);
}

if (exists('.firebaserc')) {
  const firebaserc = read('.firebaserc');
  if (firebaserc.includes('REPLACE_WITH_URAI_STORYTIME_STAGING')) {
    warnings.push('Firebase project placeholder remains in .firebaserc. Deployment must stay blocked.');
  }
}

if (exists('README.md')) {
  const readme = read('README.md');
  if (!/Not production\/live-published verified/i.test(readme)) {
    warnings.push('README should continue to state that production/live publication is not verified until deploy proof exists.');
  }
}

if (exists('functions/src/story-provider.ts')) {
  const provider = read('functions/src/story-provider.ts');
  if (!provider.includes('STORYTIME_GENERATION_PROVIDER') || !provider.includes('OPENAI_API_KEY') || !provider.includes('STORYTIME_OPENAI_MODEL')) {
    failures.push('Story provider readiness gates must require provider, API key, and model config.');
  }
}

if (exists('functions/src/readiness.ts')) {
  const readinessSource = read('functions/src/readiness.ts');
  for (const marker of [
    "process.env.STORYTIME_FIREBASE_ISOLATED === 'true'",
    "process.env.STORYTIME_CLOUD_MODE === 'true'",
    'provider.ready === true',
    "process.env.STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER !== 'true'",
    'publicShareTtlBounded',
    "claimBoundary: 'technical_runtime_only'",
    'result.ready ? 200 : 503',
    "Cache-Control', 'no-store'"
  ]) {
    if (!readinessSource.includes(marker)) failures.push(`Missing technical readiness marker: ${marker}`);
  }
  if (/OPENAI_API_KEY\s*[:=]\s*process\.env\.OPENAI_API_KEY/.test(readinessSource)) {
    failures.push('Storytime readiness must not emit provider secret values.');
  }
}

if (exists('functions/src/index.ts')) {
  const functionsIndex = read('functions/src/index.ts');
  if (!functionsIndex.includes('health, readiness') || !functionsIndex.includes('./readiness.js')) {
    failures.push('Storytime Functions entrypoint must export health and readiness.');
  }
}

if (exists('functions/src/storytime.ts')) {
  const functions = read('functions/src/storytime.ts');
  for (const marker of [
    'storyGeneration: z.literal(true)',
    'providerProcessing: z.literal(true)',
    'role: z.literal("adult_or_guardian")',
    'Story input requires safety review before generation',
    'generation_blocked_output_safety',
    'claimGenerationRequest',
    'enforceGenerationQuota',
    'prepareVoiceoverJob',
    'Voiceover consent is required'
  ]) {
    if (!functions.includes(marker)) failures.push(`Missing callable safety marker: ${marker}`);
  }
}

if (exists('functions/src/public-story-share-lifecycle.ts')) {
  const sharing = read('functions/src/public-story-share-lifecycle.ts');
  for (const marker of [
    'createPublicStoryShare',
    'revokePublicStoryShare',
    'Public sharing consent is required',
    'Only safety-approved stories can be shared',
    'requireVerifiedAccount(request)'
  ]) {
    if (!sharing.includes(marker)) failures.push(`Missing public-share safety marker: ${marker}`);
  }
}

if (exists('functions/src/privacy-requests.ts')) {
  const privacy = read('functions/src/privacy-requests.ts');
  for (const marker of [
    'requestPrivacyOperation',
    'confirmation: z.literal(true)',
    'executionState: "not_started"',
    'completionReceiptId: null'
  ]) {
    if (!privacy.includes(marker)) failures.push(`Missing privacy lifecycle marker: ${marker}`);
  }
}

if (exists('functions/src/privacy-execution.ts')) {
  const privacyExecution = read('functions/src/privacy-execution.ts');
  for (const marker of [
    'processStorytimeExportRequest',
    'getStorytimeExportDownloadUrl',
    'planStorytimeDeletion',
    'executeStorytimeDeletion',
    'verifyStorytimeDeletion',
    'active_legal_hold',
    'storytime_firebase_isolation_not_certified',
    'story_media_storage_cleanup_not_certified',
    'backup_expiry_pending',
    'DELETE_STORYTIME_DATA'
  ]) {
    if (!privacyExecution.includes(marker)) failures.push(`Missing Storytime data-rights execution marker: ${marker}`);
  }
}

if (exists('functions/src/index.ts')) {
  const functionsIndex = read('functions/src/index.ts');
  for (const marker of [
    './generate-narrator-script.js',
    './generate-emotional-arc-summary.js',
    './generate-weekly-story-scroll.js',
    './refresh-story-timeline.js',
    './rebuild-user-story-archive.js'
  ]) {
    if (!functionsIndex.includes(marker)) failures.push(`Missing real callable export: ${marker}`);
  }
}

if (exists('firestore.rules')) {
  const rules = read('firestore.rules');
  for (const marker of [
    'match /storySessions/{id}',
    'match /publicStoryShares/{id}',
    'revoked == false',
    'match /storytimeUsageCounters/{id}',
    'match /privacyDeletionPlans/{planId}',
    'match /privacyOperationReceipts/{receiptId}',
    'allow read, write: if false'
  ]) {
    if (!rules.includes(marker)) failures.push(`Missing Firestore rule marker: ${marker}`);
  }
  if (rules.includes('privacyCompletionReceipts')) {
    failures.push('Obsolete privacyCompletionReceipts rule must not remain; privacyOperationReceipts is canonical.');
  }
}

if (exists('launch-proof/urai-storytime-production-lock/2026-06-30T0100Z/README.md')) {
  const proof = read('launch-proof/urai-storytime-production-lock/2026-06-30T0100Z/README.md');
  if (!proof.includes('PARTIAL') || !proof.includes('BLOCKED FROM READY')) {
    failures.push('Latest proof folder must preserve the PARTIAL / BLOCKED FROM READY verdict until external proof exists.');
  }
} else {
  warnings.push('Latest 2026-06-30T0100Z proof folder is missing; this is expected only before proof docs are generated.');
}

const readiness = summarizeRuntimeReadiness();
if (readiness.productionReady) {
  warnings.push('Runtime readiness reports production-ready. Verify external evidence before launch copy changes.');
} else {
  warnings.push(`Runtime readiness is ${readiness.status}. Production remains blocked by runtime gates.`);
}

if (failures.length > 0) {
  console.error('\nProduction readiness validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Storytime production readiness source validation passed.');
if (warnings.length > 0) {
  console.warn('\nProduction readiness warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
  console.warn('\nWarnings are expected until Firebase, provider, deploy, smoke, and legal/safety evidence are verified.');
}
