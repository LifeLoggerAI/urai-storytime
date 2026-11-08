import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync('functions/src/storytime-request-binding.ts', 'utf8');
const { sameStorytimeGenerationBinding, isReusableStorytimeSession, isValidStorytimeSessionId } = await import(
  'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64')
);

const reviewed = 'a'.repeat(64);
const provider = 'b'.repeat(64);
const exact = { reviewedRequestSha256: reviewed, providerInputSha256: provider };

test('same immutable reviewed request and provider fingerprints authorize consideration of retry', () => {
  assert.equal(sameStorytimeGenerationBinding(exact, exact), true);
});

test('same request ID with different memory text, provider input or consent is rejected', () => {
  assert.equal(sameStorytimeGenerationBinding(exact, { ...exact, reviewedRequestSha256: 'c'.repeat(64) }), false);
  assert.equal(sameStorytimeGenerationBinding(exact, { ...exact, providerInputSha256: 'd'.repeat(64) }), false);
});

test('unverified or malformed historical fingerprints fail closed', () => {
  assert.equal(sameStorytimeGenerationBinding({}, exact), false);
  assert.equal(sameStorytimeGenerationBinding({ reviewedRequestSha256: reviewed }, exact), false);
  assert.equal(sameStorytimeGenerationBinding({ reviewedRequestSha256: reviewed, providerInputSha256: 'x' }, exact), false);
});

test('retry returns only the exact owner, request, approved source and creative derivative', () => {
  const session = {
    userId: 'owner-a', requestId: 'request-123', status: 'ready', safetyStatus: 'approved', revoked: false,
    requestReview: { processedRequestSha256: reviewed },
    provenance: { factualStatus: 'creative_derivative_not_source_evidence' }
  };
  const reusable = (value, owner = 'owner-a', id = 'request-123', hash = reviewed) =>
    isReusableStorytimeSession(value, owner, id, hash);
  assert.equal(reusable(session), true);
  assert.equal(reusable(session, 'owner-b'), false);
  assert.equal(reusable(session, 'owner-a', 'request-other'), false);
  assert.equal(reusable(session, 'owner-a', 'request-123', 'c'.repeat(64)), false);
  assert.equal(reusable({ ...session, requestReview: { processedRequestSha256: 'd'.repeat(64) } }), false);
  assert.equal(reusable({ ...session, requestReview: null }), false);
  assert.equal(reusable({ ...session, status: 'deleted' }), false);
  assert.equal(reusable({ ...session, safetyStatus: 'needs_review' }), false);
  assert.equal(reusable({ ...session, revoked: true }), false);
  assert.equal(reusable({ ...session, provenance: { factualStatus: 'recorded_source_truth' } }), false);
  assert.equal(reusable(null), false);
});

test('missing or malformed completed story IDs are never eligible for transactional reuse', () => {
  for (const invalid of [null, undefined, '', 'a', '../x', 'x/y', 'x '.repeat(10), 'a'.repeat(129)]) {
    assert.equal(isValidStorytimeSessionId(invalid), false);
  }
  assert.equal(isValidStorytimeSessionId('storySession_1000000000000_fixture'), true);
});

test('generation callable performs binding check before transactional owner story reuse', () => {
  const callable = readFileSync('functions/src/storytime.ts', 'utf8');
  const start = callable.indexOf('async function claimGenerationRequest(');
  const end = callable.indexOf('async function enforceGenerationQuota(', start);
  assert.ok(start > -1 && end > start);
  const claim = callable.slice(start, end);
  const binding = claim.indexOf('if (!sameStorytimeGenerationBinding(data,');
  const reuse = claim.indexOf('if (data.status === "succeeded"');
  assert.ok(binding > -1 && reuse > binding, 'fingerprint must precede reuse');
  assert.match(claim, /transaction\.get\(db\.collection\("storySessions"\)\.doc\(data\.sessionId\)\)/);
  assert.match(claim, /isReusableStorytimeSession\(original\.data\(\), userId, input\.requestId, expectedReviewedRequestSha256\)/);
  assert.match(claim, /reviewedRequestSha256: expectedReviewedRequestSha256/);
  assert.match(claim, /providerInputSha256: expectedProviderInputSha256/);
  assert.match(claim, /if \(!isValidStorytimeSessionId\(data\.sessionId\)\)/);
  assert.match(claim, /if \(data\.cancellationRequested === true/);
  assert.match(claim, /throw new HttpsError\("failed-precondition", "This Storytime request requires reconciliation before any further generation\."\)/);
  assert.ok(claim.indexOf('if (data.status === "succeeded")') > claim.indexOf('if (data.cancellationRequested === true'));
  assert.ok(claim.indexOf('throw new HttpsError("failed-precondition", "This Storytime request requires reconciliation') > claim.indexOf('if (data.status === "processing")'));
});
