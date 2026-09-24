import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const execution = fs.readFileSync('functions/src/privacy-execution.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const controls = fs.readFileSync('src/components/storytime/PrivacyRequestControls.tsx', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');

test('Storytime export packages owner data privately with integrity and short-lived retrieval', () => {
  for (const marker of [
    'processStorytimeExportRequest',
    'getStorytimeExportDownloadUrl',
    'storytime-export-v1',
    'storytime-export-manifest-v1',
    'packageSha256',
    'private, max-age=0, no-store',
    'EXPORT_SIGNED_URL_TTL_MS = 15 * 60 * 1000',
    'complete_for_storytime_owned_data',
    'partial_review_required'
  ]) assert.ok(execution.includes(marker), `missing export marker: ${marker}`);
  assert.match(index, /processStorytimeExportRequest/);
  assert.match(index, /getStorytimeExportDownloadUrl/);
});

test('Storytime deletion is dry-run/hash/admin-only and revalidated before destructive mutation', () => {
  for (const marker of [
    'planStorytimeDeletion',
    'executeStorytimeDeletion',
    'verifyStorytimeDeletion',
    'expectedPlanHash',
    'DELETE_STORYTIME_DATA',
    'Admin authority is required for destructive Storytime deletion',
    'Storytime deletion targets changed',
    'active_legal_hold',
    'storytime_firebase_isolation_not_certified',
    'family_or_child_data_requires_urai_privacy_review',
    'verification_required',
    'backup_expiry_pending'
  ]) assert.ok(execution.includes(marker), `missing deletion marker: ${marker}`);
});

test('destructive account deletion and completion remain fail-closed behind environment truth', () => {
  assert.match(execution, /STORYTIME_FIREBASE_ISOLATED !== "true"/);
  assert.match(execution, /STORYTIME_BACKUP_RETENTION_POLICY_READY !== "true"/);
  assert.match(env, /STORYTIME_BACKUP_RETENTION_POLICY_READY=false/);
});

test('privacy evidence collections are server-only', () => {
  assert.match(rules, /match \/privacyDeletionPlans\/\{id\} \{ allow read, write: if false; \}/);
  assert.match(rules, /match \/privacyCompletionReceipts\/\{id\} \{ allow read, write: if false; \}/);
});

test('settings initiate export packaging and deletion planning but never destructive execution', () => {
  assert.match(controls, /processStorytimeExportRequest/);
  assert.match(controls, /getStorytimeExportDownloadUrl/);
  assert.match(controls, /Download latest Storytime export/);
  assert.match(controls, /planStorytimeDeletion/);
  assert.match(controls, /No data has been deleted/);
  assert.doesNotMatch(controls, /executeStorytimeDeletion/);
  assert.doesNotMatch(controls, /verifyStorytimeDeletion/);
});
