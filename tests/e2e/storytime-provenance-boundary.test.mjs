import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const functions = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const types = fs.readFileSync('src/lib/storytime/types.ts', 'utf8');
const contracts = fs.readFileSync('src/lib/storytime/integration-contracts.ts', 'utf8');

test('generated cloud stories identify themselves as derivatives rather than source evidence', () => {
  for (const marker of [
    'schemaVersion: "storytime-provenance-v1"',
    'sourceType: "direct_storytime_input"',
    'sourceId: input.requestId',
    'consentVersion: input.consentSnapshot.consentVersion',
    'factualStatus: "creative_derivative_not_source_evidence"'
  ]) assert.ok(functions.includes(marker), `missing provenance marker: ${marker}`);
  assert.match(types, /creative_derivative_not_source_evidence/);
});

test('future-system integration preserves explicit source provenance and remains hard-off', () => {
  assert.match(contracts, /StorytimeProvenanceReference/);
  assert.match(contracts, /fictionalized: boolean/);
  assert.match(contracts, /aiGenerated: boolean/);
  assert.match(contracts, /activationState: "hard_off"/);
  assert.match(contracts, /publicReleaseAuthorized: false/);
});
