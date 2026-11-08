import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const src = readFileSync('functions/src/storytime.ts', 'utf8');
const writeStart = src.indexOf('const writeStory = (writer:');
const writeEnd = src.indexOf('  if (providerReceipt.provider === "openai") {\n    try {\n      if (!confirmPaidOutput)', writeStart);
assert.ok(writeStart >= 0 && writeEnd > writeStart);
const persistence = src.slice(writeStart, writeEnd);
const builderStart = persistence.indexOf('} else {');
const builderEnd = persistence.indexOf('  } catch (error) {', builderStart);
assert.ok(builderStart >= 0 && builderEnd > builderStart);
const local = persistence.slice(builderStart, builderEnd);

test('deterministic builder persists with one Firestore transaction, not an unguarded batch', () => {
  assert.match(local, /await db\.runTransaction\(async \(transaction\) => \{/);
  assert.match(local, /transaction\.get\(generationRequest\.requestRef\)/);
  assert.match(local, /writeStory\(transaction\)/);
  assert.doesNotMatch(local, /db\.batch\(\)|batch\.commit\(\)/);
  assert.ok(local.indexOf('transaction.get(generationRequest.requestRef)') < local.indexOf('writeStory(transaction)'));
});

test('cancellation, owner and immutable input checks occur before local write', () => {
  for (const marker of [
    'claim.userId !== userId',
    'claim.requestId !== input.requestId',
    'claim.cancellationRequested === true',
    'claim.status === "cancellation_requested"',
    'claim.status === "cancelled"',
    'claim.status !== "processing"',
    'sameStorytimeGenerationBinding(claim,',
    'reviewedRequestSha256: processedRequestSha256',
    'providerInputSha256: storySpendHash(storySourceJson(providerInput))',
    'claim.consentSnapshot?.storyGeneration !== true',
    'claim.consentSnapshot?.providerProcessing !== true',
    'claim.consentVersion !== STORY_GENERATION_CONSENT_VERSION'
  ]) assert.ok(local.includes(marker), 'missing prewrite guard: ' + marker);
  assert.ok(local.indexOf('claim.cancellationRequested === true') < local.indexOf('writeStory(transaction)'));
});

test('explicit cancellation denial is not overwritten by generic reconciliation', () => {
  assert.match(persistence, /providerReceipt\.provider === "local_builder" && error instanceof HttpsError/);
  assert.match(persistence, /\["cancelled", "failed-precondition", "permission-denied"\]\.includes\(error\.code\)/);
  assert.ok(persistence.indexOf('throw error;') < persistence.indexOf('reconcileStoryPersistence({'));
});

test('paid pathway remains protected by its original admission transaction', () => {
  assert.match(persistence, /if \(!commitPaidOutput\) throw new HttpsError/);
  assert.match(persistence, /await commitPaidOutput\(writeStory\)/);
  assert.ok(persistence.indexOf('await commitPaidOutput(writeStory)') < persistence.indexOf('await db.runTransaction(async (transaction)'));
});

test('generated story remains labeled creative derivative, not recorded source', () => {
  assert.match(src, /factualStatus: "creative_derivative_not_source_evidence"/);
  assert.match(src, /sourceType: "direct_storytime_input"/);
});
