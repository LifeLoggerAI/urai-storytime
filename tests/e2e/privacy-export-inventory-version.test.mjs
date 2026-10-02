import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../functions/src/privacy-execution.ts', import.meta.url), 'utf8');
const start = source.indexOf('export const processStorytimeExportRequest =');
const end = source.indexOf('export const planStorytimeDeletion =', start);
assert.ok(start >= 0 && end > start);
const compiled = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const inventoryVersion = 'storytime-owner-ledger-inventory-v2';

function handlers(current = false) {
  let scans = 0;
  let signedUrls = 0;
  const updates = [];
  const data = {
    userId: 'owner-a', scope: 'account', executionState: 'completed',
    exportPath: 'prior/export.json', exportManifestPath: 'prior/manifest.json',
    exportPackageSha256: 'prior-hash', exportCompleteness: 'complete_for_storytime_owned_data',
    ...(current ? { exportInventoryVersion: inventoryVersion } : {}),
  };
  const context = vm.createContext({
    exports: {}, onCall: fn => fn,
    requireVerifiedOwner: () => 'owner-a',
    ExportRequestSchema: { parse: value => value },
    readOwnedPrivacyRequest: async () => ({ data, ref: { update: async value => updates.push(value) } }),
    collectAccountRows: async () => { scans++; return {}; }, collectSessionRows: async () => ({}),
    familyMemberships: async () => ({ memberships: [], truncated: false }),
    externalArtifactPointers: () => [], flattenExternalRows: () => [],
    nowIso: () => '2026-09-26T00:00:00.000Z', authAccountMetadata: async () => ({}),
    serializeCollections: value => value, recordCounts: () => ({}), sha256: () => 'new-hash',
    writeJson: async path => ({ path, sha256: 'file-hash' }), writeReceipt: async () => 'receipt-a',
    auditLog: () => {}, STORYTIME_EXPORT_SCHEMA_VERSION: 'storytime-export-v1',
    STORYTIME_PRIVACY_POLICY_VERSION: 'test', STORYTIME_EXPORT_INVENTORY_VERSION: inventoryVersion,
    EXPORT_SIGNED_URL_TTL_MS: 1000,
    HttpsError: class extends Error { constructor(code, message) { super(message); this.code = code; } },
    bucket: { file: () => ({ getSignedUrl: async () => { signedUrls++; return ['synthetic-url']; } }) },
  });
  vm.runInContext(compiled, context);
  return { ...context.exports, scans: () => scans, signedUrls: () => signedUrls, updates };
}

test('legacy completed exports are regenerated with the current owner-ledger inventory', async () => {
  const h = handlers();
  const result = await h.processStorytimeExportRequest({ data: { privacyRequestId: 'privacy-a' } });
  assert.equal(result.reused, false);
  assert.equal(h.scans(), 1);
  assert.equal(h.updates.at(-1).exportInventoryVersion, inventoryVersion);
});

test('current inventory exports retain idempotent reuse', async () => {
  const h = handlers(true);
  const result = await h.processStorytimeExportRequest({ data: { privacyRequestId: 'privacy-a' } });
  assert.equal(result.reused, true);
  assert.equal(h.scans(), 0);
});

test('legacy inventory cannot receive a newly signed download URL', async () => {
  const h = handlers();
  await assert.rejects(h.getStorytimeExportDownloadUrl({ data: { privacyRequestId: 'privacy-a' } }), /Regenerate/);
  assert.equal(h.signedUrls(), 0);
});
