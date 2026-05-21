import { execSync } from 'node:child_process';
import fs from 'node:fs';

function fail(message) {
  console.error(`Deploy readiness failed: ${message}`);
  process.exit(1);
}

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    const stdout = typeof error === 'object' && error && 'stdout' in error ? String(error.stdout || '') : '';
    const stderr = typeof error === 'object' && error && 'stderr' in error ? String(error.stderr || '') : '';
    fail(`${command} failed. ${stdout || stderr || 'No command output was captured.'}`.trim());
  }
}

const requiredFiles = [
  'package-lock.json',
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules',
  'playwright.config.ts',
  'scripts/check-playwright-config.mjs',
  'functions/package.json',
  'functions/tsconfig.json',
  'functions/src/index.ts'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) fail(`Missing required file: ${file}`);
}

const functionsPackage = JSON.parse(fs.readFileSync('functions/package.json', 'utf8'));
if (!functionsPackage.scripts?.build) {
  fail('functions/package.json must expose a build script before Firebase deployment.');
}
if (functionsPackage.main !== 'lib/index.js') {
  fail('functions/package.json main must point to lib/index.js.');
}

const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
const functionsEntry = fs.readFileSync('functions/src/index.ts', 'utf8');
const hostingRewrites = firebaseConfig.hosting?.rewrites || [];

for (const rewrite of hostingRewrites) {
  if (rewrite.function && !functionsEntry.includes(`export const ${rewrite.function}`)) {
    fail(`firebase.json rewrites to missing function export: ${rewrite.function}`);
  }
}

const target = process.env.URAI_DEPLOY_TARGET;
if (!target || !['staging', 'production'].includes(target)) {
  fail('Set URAI_DEPLOY_TARGET=staging or URAI_DEPLOY_TARGET=production before deploying.');
}

const firebaseProject = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || '';
if (!firebaseProject) {
  fail('Set FIREBASE_PROJECT_ID or GCLOUD_PROJECT so firebase deploy cannot use an accidental default project.');
}

if (target === 'production' && process.env.URAI_PRODUCTION_DEPLOY_APPROVED !== 'true') {
  fail('Production deploys require URAI_PRODUCTION_DEPLOY_APPROVED=true after validation and release approval.');
}

let branch = 'unknown';
try {
  branch = run('git rev-parse --abbrev-ref HEAD');
} catch {
  // Git metadata may be unavailable in some CI deployment environments.
}

if (target === 'production' && branch !== 'main') {
  fail(`Production deploys must run from main. Current branch: ${branch}`);
}

run('URAI_SKIP_PLAYWRIGHT_RUNTIME_CHECK=true node scripts/check-playwright-config.mjs');
console.log(`Deploy readiness passed for ${target} using Firebase project ${firebaseProject}.`);