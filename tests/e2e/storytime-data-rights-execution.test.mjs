import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const execution = fs.readFileSync('functions/src/privacy-execution.ts', 'utf8');
const index = fs.readFileSync('functions/src/index.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');
const controls = fs.readFileSync('src/components/storytime/PrivacyRequestControls.tsx', 'utf8');

test('Storytime export execution is owner-verified, private, portable, idempotent, and signed-url delivered', () => {
  for (const marker of [
    'processStorytimeExportRequest',
    'getStorytimeExportDownloadUrl',
    'requireVerifiedOwner',
    'storytime-export-v1',
    'storytime-export-manifest-v1',
    'complete_for_storytime_owned_data',
    'partial_review_required',
    'EXPORT_SIGNED_URL_TTL_MS',
    'getSignedUrl',
    'exportPath',
    'exportPackageSha256',
    'Storytime export requires privacy review before download can be authorized',
    'reused: true'
  ]) assert.ok(execution.includes(marker), `missing export marker: ${marker}`);

  assert.match(index, /processStorytimeExportRequest/);
  assert.match(index, /getStorytimeExportDownloadUrl/);
  assert.match(controls, /Download private Storytime export/);
  assert.match(controls, /blockers.length === 0/);
});

test('Storytime destructive deletion follows dry-run hash, legal-hold, admin-only, isolation, and verification gates', () => {
  for (const marker of [
    'planStorytimeDeletion',
    'executeStorytimeDeletion',
    'verifyStorytimeDeletion',
    'requireAdmin',
    'active_legal_hold',
    'storytime_firebase_isolation_not_certified',
    'family_or_child_data_requires_urai_privacy_review',
    'story_media_storage_cleanup_not_certified',
    'expectedPlanHash',
    'DELETE_STORYTIME_DATA',
    'verification_required',
    'backup_expiry_pending',
    'STORYTIME_BACKUP_RETENTION_POLICY_READY'
  ]) assert.ok(execution.includes(marker), `missing deletion marker: ${marker}`);

  assert.match(env, /STORYTIME_FIREBASE_ISOLATED=false/);
  assert.match(env, /STORYTIME_BACKUP_RETENTION_POLICY_READY=false/);
  assert.match(controls, /No data has been deleted/);
});

test('deletion plans and operation receipts are server-only and completion cannot be claimed from a request alone', () => {
  assert.match(rules, /match \/privacyDeletionPlans\/\{id\}/);
  assert.match(rules, /match \/privacyOperationReceipts\/\{id\}/);
  assert.match(rules, /allow read, write: if false/);
  assert.match(execution, /completionReceiptId: null/);
  assert.match(execution, /deletionCompletionVerified: false/);
  assert.match(execution, /status: "completed"/);
});

test('Storytime privacy execution retains privacy evidence and does not silently delete family/shared authority', () => {
  assert.match(execution, /privacyRequests/);
  assert.match(execution, /privacyDeletionPlans/);
  assert.match(execution, /privacyOperationReceipts/);
  assert.match(execution, /legalHoldRecords/);
  assert.match(execution, /familyMemberships/);
  assert.match(execution, /family_or_child_data_requires_urai_privacy_review/);
});
