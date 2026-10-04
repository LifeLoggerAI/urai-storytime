import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const adapter = fs.readFileSync('src/lib/storytime/asset-factory.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');

test('Storytime Asset Factory execution remains hard-off unless explicitly authorized', () => {
  assert.match(adapter, /STORYTIME_ASSET_FACTORY_EXECUTION/);
  assert.match(adapter, /Asset-Factory execution is hard-off for Storytime/);
  assert.match(adapter, /requireAssetFactoryExecutionAuthorization\(\)/);
  assert.match(env, /STORYTIME_ASSET_FACTORY_EXECUTION=false/);
});

test('Asset Factory foundation uses the governed hard-off integration envelope', () => {
  assert.match(adapter, /buildHardOffStorytimeIntegration/);
  assert.match(adapter, /destinationSystem: "asset-factory"/);
  assert.match(adapter, /privacyClass: "owner_only"/);
  assert.match(adapter, /new AbortController\(\)/);
  assert.match(adapter, /20_000/);
});
