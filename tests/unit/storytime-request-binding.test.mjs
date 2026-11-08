import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync('functions/src/storytime-request-binding.ts', 'utf8');
const { sameStorytimeGenerationBinding, isReusableStorytimeSession } = await import(
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

test('retry returns only a ready, nonrevoked story with exact owner and request', () => {
  const session = { userId: 'owner-a', requestId: 'request-123', status: 'ready', revoked: false };
  assert.equal(isReusableStorytimeSession(session, 'owner-a', 'request-123'), true);
  assert.equal(isReusableStorytimeSession(session, 'owner-b', 'request-123'), false);
  assert.equal(isReusableStorytimeSession(session, 'owner-a', 'request-999'), false);
  assert.equal(isReusableStorytimeSession({ ...session, status: 'deleted' }, 'owner-a', 'request-123'), false);
  assert.equal(isReusableStorytimeSession({ ...session, revoked: true }, 'owner-a', 'request-123'), false);
  assert.equal(isReusableStorytimeSession(null, 'owner-a', 'request-123'), false);
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
  assert.match(claim, /isReusableStorytimeSession\(original\.data\(\), userId, input\.requestId\)/);
  assert.match(claim, /reviewedRequestSha256: expectedReviewedRequestSha256/);
  assert.match(claim, /providerInputSha256: expectedProviderInputSha256/);
});
