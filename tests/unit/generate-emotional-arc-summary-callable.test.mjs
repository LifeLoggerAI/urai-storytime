import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('functions/src/generate-emotional-arc-summary.ts', 'utf8');

test('emotional arc callable requires auth and validates request data', () => {
  assert.match(source, /request\.auth\?\.uid/);
  assert.match(source, /unauthenticated/);
  assert.match(source, /const RequestSchema = z\.object/);
  assert.match(source, /sessionId: z\.string\(\)\.min\(1\)/);
});

test('emotional arc callable enforces owned session access', () => {
  assert.match(source, /async function ownedSession/);
  assert.match(source, /storySessions/);
  assert.match(source, /snap\.data\(\)\?\.userId !== userId/);
  assert.match(source, /permission-denied/);
});

test('emotional arc callable writes summary and links session in a batch', () => {
  assert.match(source, /buildEmotionalArcRecord/);
  assert.match(source, /db\.batch\(\)/);
  assert.match(source, /db\.collection\("emotionalArcSummaries"\)/);
  assert.match(source, /batch\.update\(session\.ref, \{ emotionalArcSummaryId, updatedAt: createdAt \}\)/);
  assert.match(source, /await batch\.commit\(\)/);
});
