import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

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
    exportSourceInventorySha256: 'new-sources', completionReceiptId: 'receipt-a',
    exportExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...(current ? { exportInventoryVersion: inventoryVersion } : {}),
  };
  const context = vm.createContext({
    exports: {}, onCall: fn => fn, onRequest: (_options, fn) => fn,
    requireVerifiedOwner: () => 'owner-a',
    requireCurrentStorytimeOwner: async () => 'owner-a',
    z, ExportRequestSchema: z.object({ privacyRequestId: z.string().min(1) }),
    readOwnedPrivacyRequest: async () => ({ data, ref: { update: async value => updates.push(value) } }),
    collectAccountRows: async () => { scans++; return {}; }, collectSessionRows: async () => ({}),
    exportRequestAuthority: () => ({ hash: 'authority', expiresAt: Date.now() + 60 * 60 * 1000 }),
    currentExportSources: async () => { scans++; return { collections: {}, family: { memberships: [], truncated: false }, hash: 'new-sources', sessions: [] }; },
    familyMemberships: async () => ({ memberships: [], truncated: false }),
    externalArtifactPointers: () => [], flattenExternalRows: () => [],
    nowIso: () => new Date().toISOString(), authAccountMetadata: async () => ({}),
    serializeCollections: value => value, recordCounts: () => ({}), sha256: () => 'new-hash',
    writeJson: async path => ({ path, sha256: 'file-hash' }), writeReceipt: async () => 'receipt-a',
    auditLog: () => {}, STORYTIME_EXPORT_SCHEMA_VERSION: 'storytime-export-v1',
    STORYTIME_PRIVACY_POLICY_VERSION: 'test', STORYTIME_EXPORT_INVENTORY_VERSION: inventoryVersion,
    EXPORT_DOWNLOAD_URL_TTL_MS: 1000, EXPORT_PACKAGE_TTL_MS: 24 * 60 * 60 * 1000,
    db: { runTransaction: async callback => callback({ update: (_ref, value) => updates.push(value) }) },
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
  assert.equal(h.scans(), 5);
  assert.equal(h.updates.at(-1).exportInventoryVersion, inventoryVersion);
});

test('current inventory exports retain reuse only after a fresh source inventory read', async () => {
  const h = handlers(true);
  const result = await h.processStorytimeExportRequest({ data: { privacyRequestId: 'privacy-a' } });
  assert.equal(result.reused, true);
  assert.equal(h.scans(), 2);
});

test('legacy inventory cannot receive authenticated download authority', async () => {
  const h = handlers();
  await assert.rejects(h.getStorytimeExportDownloadUrl({ data: { privacyRequestId: 'privacy-a' } }), /Regenerate/);
  assert.equal(h.signedUrls(), 0);
});
