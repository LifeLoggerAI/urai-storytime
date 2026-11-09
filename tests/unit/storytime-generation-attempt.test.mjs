import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const helperSource = readFileSync('src/lib/storytime/generation-attempt.ts','utf8');
const {bindStorytimeGenerationAttempt} = await import('data:text/javascript;base64,' +
  Buffer.from(stripTypeScriptTypes(helperSource)).toString('base64'));
const home = readFileSync('src/components/storytime/StorytimeHome.tsx','utf8');
const backend = readFileSync('functions/src/storytime.ts','utf8');

test('same exact actor and reviewed input retains original provider request identity', () => {
  const actor = {uid:'synthetic-A'};
  const initial = bindStorytimeGenerationAttempt(null, actor, 'review-1', () => 'original-story-id-123');
  assert.equal(bindStorytimeGenerationAttempt(initial, actor, 'review-1', () => { throw Error('duplicate allocation'); }), initial);
});

test('newly reviewed source has a new request ID; different account cannot reuse old one', () => {
  const actor = {uid:'synthetic-A'};
  const initial = bindStorytimeGenerationAttempt(null, actor, 'review-1', () => 'original-story-id-123');
  assert.equal(bindStorytimeGenerationAttempt(initial, actor, 'review-2', () => 'new-story-id-123').requestId,'new-story-id-123');
  assert.equal(bindStorytimeGenerationAttempt(initial, {uid:'synthetic-A'}, 'review-1', () => 'other-session-123').requestId,'other-session-123');
  assert.equal(bindStorytimeGenerationAttempt(initial, {uid:'synthetic-B'}, 'review-1', () => 'other-actor-id-123').requestId,'other-actor-id-123');
});

test('reject missing owner, blank review and malformed provider request identity', () => {
  assert.throws(() => bindStorytimeGenerationAttempt(null, null, 'review', () => 'valid-request-id-123'));
  assert.throws(() => bindStorytimeGenerationAttempt(null, {uid:'synthetic'}, '', () => 'valid-request-id-123'));
  for (const value of ['', 'a', '../escape', 'x'.repeat(129)]) {
    assert.throws(() => bindStorytimeGenerationAttempt(null, {uid:'synthetic'}, 'review', () => value));
  }
});

test('frontend binds callable to original reviewed request and never allocates ID inline', () => {
  assert.match(home, /bindStorytimeGenerationAttempt\(generationAttempt\.current, actor, requestReviewFingerprint, createRequestId\)/);
  assert.match(home, /generationAttempt\.current = attempt/);
  assert.match(home, /requestId: attempt\.requestId/);
  assert.doesNotMatch(home, /requestId: createRequestId\(\)/);
});

test('ambiguous callable outcome is fail-closed and does not claim no story was saved', () => {
  assert.match(home, /setGenerationOutcomeUnknown\(true\)/);
  assert.match(home, /if \(generationOutcomeUnknown\)/);
  assert.match(home, /draftSaving \|\| generationOutcomeUnknown/);
  assert.match(home, /may already have been saved/i);
  assert.doesNotMatch(home, /No private story was saved\. Please try again\./);
});

test('auth actor change and unmount invalidate local request and unknown-outcome state', () => {
  assert.match(home, /activeActor\.current = user;\s*generationAttempt\.current = null;\s*setGenerationOutcomeUnknown\(false\)/);
  assert.match(home, /activeActor\.current = null;\s*generationAttempt\.current = null;\s*unsubscribe\(\)/);
});

test('server reuse remains source and owner bound, processing and held claims do not double-dispatch', () => {
  const claimStart = backend.indexOf('async function claimGenerationRequest(');
  const claimEnd = backend.indexOf('async function enforceGenerationQuota(',claimStart);
  assert.ok(claimStart > -1 && claimEnd > claimStart);
  const claim = backend.slice(claimStart,claimEnd);
  assert.match(claim,/sameStorytimeGenerationBinding/);
  assert.match(claim,/isReusableStorytimeSession/);
  assert.match(claim,/data\.status === "processing"/);
  assert.match(claim,/No existing claim can be overwritten for another provider attempt/);
});
