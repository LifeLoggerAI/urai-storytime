import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const localText = readFileSync('src/lib/storytime/redaction.ts','utf8');
const { explainWhyGenerated } = await import('data:text/javascript;base64,' +
  Buffer.from(stripTypeScriptTypes(localText)).toString('base64'));
const backend = readFileSync('functions/src/storytime.ts','utf8');
const provider = readFileSync('functions/src/story-provider.ts','utf8');
const builder = readFileSync('src/lib/storytime/story-builder.ts','utf8');

test('no-source label does not claim a verified recorded memory', () => {
  const copy = explainWhyGenerated([]);
  assert.match(copy, /not verified against recorded memories/i);
  assert.doesNotMatch(copy, /recorded memory was retrieved|observed event/i);
});

test('sensitive source labels never appear in public-facing explanation', () => {
  const privateSignal = 'synthetic-private-label-123';
  const copy = explainWhyGenerated([privateSignal]);
  assert.doesNotMatch(copy, new RegExp(privateSignal));
  assert.match(copy, /unverified context/i);
  assert.match(copy, /not used to generate the narrative/i);
});

test('backend attribution excludes arbitrary labels and follows actual provider input', () => {
  const start = backend.indexOf('function providerInputFromRequest(');
  const end = backend.indexOf('type ProviderBudgetReservation', start);
  assert.ok(start > -1 && end > start);
  const input = backend.slice(start,end);
  assert.doesNotMatch(input, /sourceSignals/);
  assert.match(input, /sourceText: source/);
  assert.match(input, /symbolicMotifs: input.symbolicMotifs/);
  const attribution = backend.slice(backend.indexOf('    whyGenerated: input.sourceSignals.length'),backend.indexOf('    safetyStatus: outputModeration.safetyStatus,',backend.indexOf('    whyGenerated: input.sourceSignals.length')));
  assert.match(attribution, /unverified context/);
  assert.doesNotMatch(attribution, /input\.sourceSignals\.join/);
  assert.match(backend, /factualStatus: "creative_derivative_not_source_evidence"/);
});

test('provider prompt and local builder do not silently resolve source-signal IDs', () => {
  assert.match(provider,/Source: \$\{input.sourceText/);
  assert.doesNotMatch(provider,/input\.sourceSignals/);
  assert.match(builder,/sourceSignals,/);
  assert.match(builder,/whyGenerated: explainWhyGenerated\(sourceSignals\)/);
  assert.doesNotMatch(builder,/sourceSignals\.join\(/);
});
