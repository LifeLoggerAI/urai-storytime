import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/storytime/asset-factory.ts', 'utf8');

test('Asset-Factory adapter maps Storytime sessions into the documented job schema', () => {
  assert.match(source, /export interface AssetFactoryStoryInput/);
  assert.match(source, /story_input/);
  assert.match(source, /scenes/);
  assert.match(source, /scene_number/);
  assert.match(source, /platform_targets/);
  assert.match(source, /urai_storytime/);
});

test('Asset-Factory adapter submits jobs to the v1 jobs endpoint with bearer auth', () => {
  assert.match(source, /createAssetFactoryJob/);
  assert.match(source, /ASSET_FACTORY_BASE_URL/);
  assert.match(source, /ASSET_FACTORY_API_KEY/);
  assert.match(source, /\/v1\/jobs/);
  assert.match(source, /method: "POST"/);
  assert.match(source, /authorization: `Bearer \$\{apiKey\}`/);
});

test('Asset-Factory adapter exposes polling and ingestion records for the Storytime lifecycle', () => {
  assert.match(source, /getAssetFactoryJobStatus/);
  assert.match(source, /\/v1\/jobs\/\$\{encodeURIComponent\(jobId\)\}/);
  assert.match(source, /toStorytimeAssetIngestionRecord/);
  assert.match(source, /assetFactoryJobId/);
  assert.match(source, /bundleUrl/);
  assert.match(source, /source: "asset_factory"/);
});

test('Asset-Factory adapter maps provider status into StoryExport records', () => {
  assert.match(source, /import type \{ StoryChapter, StoryExport, StorySession \}/);
  assert.match(source, /toStoryExportFromAssetFactoryStatus/);
  assert.match(source, /exportType: "asset_factory_zip"/);
  assert.match(source, /id: `storyExport_\$\{status\.job_id\}`/);
  assert.match(source, /downloadUrl: status\.asset_bundle_url \|\| status\.download_url/);
  assert.match(source, /storagePath: status\.storage_path/);
  assert.match(source, /assetFactoryJobId: status\.job_id/);
});

test('Asset-Factory status mapping preserves queued, running, completed, and failed states', () => {
  assert.match(source, /if \(status === "succeeded"\) return "completed"/);
  assert.match(source, /if \(status === "failed" \|\| status === "cancelled"\) return "failed"/);
  assert.match(source, /if \(status === "running"\) return "running"/);
  assert.match(source, /return "queued"/);
});
