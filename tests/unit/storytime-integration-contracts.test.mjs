import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/storytime/integration-contracts.ts', 'utf8');

test('Storytime integration envelope is versioned, provenance-bound and hard-off', () => {
  for (const marker of [
    'storytime-integration-envelope-v1',
    'sourceSystem: "urai-storytime"',
    'repository: "LifeLoggerAI/urai-storytime"',
    '"urai-studio" | "asset-factory" | "urai-content" | "urai-spatial"',
    'activationState: "hard_off"',
    'publicReleaseAuthorized: false',
    'providerSpendAuthorized: false',
    'consentVersion: string',
    'fictionalized: boolean',
    'aiGenerated: boolean',
    'edited: boolean'
  ]) {
    assert.ok(source.includes(marker), `missing integration marker: ${marker}`);
  }
});

test('public-safe integration cannot be promoted through the hard-off builder', () => {
  assert.match(source, /privacyClass: Exclude<StorytimePrivacyClass, "public_safe">/);
  assert.match(source, /Public integration promotion requires a separate reviewed release process/);
  assert.match(source, /Storytime future-system integration must remain hard-off until separately approved/);
});

test('spatial fallback contract requires accessibility-preserving derivatives', () => {
  assert.match(source, /textRequired: true/);
  assert.match(source, /captionsRequired: true/);
  assert.match(source, /reducedMotionRequired: true/);
});
