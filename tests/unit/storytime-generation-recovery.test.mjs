import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync('functions/src/story-generation-recovery-contract.ts','utf8');
const { sanitizeStorytimeRecoveryReceipt } = await import(
  'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64')
);
const callable = readFileSync('functions/src/story-generation-recovery.ts','utf8');
const index = JSON.parse(readFileSync('firestore.indexes.json','utf8'));
const exportsText = readFileSync('functions/src/index.ts','utf8');

function example(overrides = {}) {
  return { userId: 'owner-a', requestId: 'request-12345',
    status: 'processing', updatedAt: '2026-11-08T18:00:00.000Z',
    reviewedRequestSha256: 'a'.repeat(64),
    ...overrides
  };
}

test('only current owner receives any receipt', () => {
  assert.equal(sanitizeStorytimeRecoveryReceipt(example(), 'owner-b'), null);
  assert.equal(sanitizeStorytimeRecoveryReceipt(example({userId:'owner-b'}),'owner-a'),null);
  assert.equal(sanitizeStorytimeRecoveryReceipt(example(),''),null);
});

test('input schema rejects forged or malformed request identities', () => {
  assert.equal(sanitizeStorytimeRecoveryReceipt(example({requestId:'../escape'}),'owner-a'),null);
  assert.equal(sanitizeStorytimeRecoveryReceipt(example({requestId:'x'}),'owner-a'),null);
  assert.equal(sanitizeStorytimeRecoveryReceipt(example({requestId:'x'.repeat(129)}),'owner-a'),null);
});

test('processing receipt contains only bounded public keys and no private source or spend', () => {
  const output=sanitizeStorytimeRecoveryReceipt(example({
    sourceText:'SECRET-MEMORY', sourceSignals:['SECRET-LABEL'], providerReceipt:{private:'SECRET'},
    consentSnapshot:{sourceText:'SECRET'}, providerInputSha256:'b'.repeat(64)
  }), 'owner-a');
  assert.equal(output.state,'processing');
  assert.equal(output.retryAuthorized,false);
  assert.equal(output.sessionId,null);
  assert.deepEqual(Object.keys(output).sort(), ['requestId','retryAuthorized','sessionId','state','updatedAt'].sort());
  assert.doesNotMatch(JSON.stringify(output),/SECRET|sourceSignals|consentSnapshot|providerReceipt|providerInputSha256/);
});

test('completed output is hidden until current owner session is independently verified', () => {
  const item=example({status:'succeeded',sessionId:'session-12345'});
  assert.equal(sanitizeStorytimeRecoveryReceipt(item,'owner-a').state,'requires_review');
  assert.equal(sanitizeStorytimeRecoveryReceipt(item,'owner-a').sessionId,null);
  assert.equal(sanitizeStorytimeRecoveryReceipt(item,'owner-a','other-session').sessionId,null);
  const ok=sanitizeStorytimeRecoveryReceipt(item,'owner-a','session-12345');
  assert.equal(ok.state,'ready');
  assert.equal(ok.sessionId,'session-12345');
});

test('cancelled and cancellation requested are distinct, neither authorizes retries', () => {
  const cancelled=sanitizeStorytimeRecoveryReceipt(example({status:'cancelled',cancellationRequested:true}), 'owner-a');
  const requested=sanitizeStorytimeRecoveryReceipt(example({status:'cancellation_requested',cancellationRequested:true}),'owner-a');
  assert.equal(cancelled.state,'cancelled');
  assert.equal(requested.state,'cancellation_requested');
  assert.equal(cancelled.retryAuthorized,false);
});

test('failed, stale, unknown, held and needs-review states cannot imply re-admission', () => {
  for (const status of ['failed','requires_reconciliation','needs_review','held_after_failure','unknown']) {
    const out=sanitizeStorytimeRecoveryReceipt(example({status}), 'owner-a');
    assert.equal(out.state,'requires_review');
    assert.equal(out.retryAuthorized,false);
    assert.equal(out.sessionId,null);
  }
});

test('bad times are omitted instead of echoed and optional fields are stripped', () => {
  assert.equal(sanitizeStorytimeRecoveryReceipt(example({updatedAt:'not-an-ISO-date'}),'owner-a').updatedAt,null);
  assert.equal(sanitizeStorytimeRecoveryReceipt(example({updatedAt:'X'.repeat(200)}),'owner-a').updatedAt,null);
});

test('callable is auth-scoped, read-only, bounded and validates owned completed session', () => {
  assert.match(callable,/request\.auth\?\.uid/);
  assert.match(callable,/email_verified !== true/);
  assert.match(callable,/\.where\("userId", "==", userId\)/);
  assert.match(callable,/\.orderBy\("createdAt", "desc"\)/);
  assert.match(callable,/\.limit\(MAX_RECENT_RECEIPTS\)/);
  assert.match(callable,/\.doc\(\`\$\{userId\}_\$\{input\.requestId\}\`\)/);
  assert.match(callable,/isReusableStorytimeSession/);
  assert.match(callable,/sanitizeStorytimeRecoveryReceipt/);
  assert.doesNotMatch(callable,/transaction\.(set|update|delete)|\.add\(|\.create\(/);
  assert.match(callable,/retryAuthorized: false/);
});

test('Functions index exports recovery without exposing raw backend store through Firestore rules', () => {
  assert.match(exportsText,/getStorytimeGenerationRecovery/);
  const rules=readFileSync('firestore.rules','utf8');
  assert.match(rules,/match \/storyGenerationRequests\/\{id\} \{ allow read, write: if false; \}/);
});

test('owner-scoped createdAt ordering has matching composite Firestore index', () => {
  assert.ok(index.indexes.some(i=>i.collectionGroup==='storyGenerationRequests'
    && i.queryScope==='COLLECTION'
    && i.fields?.[0]?.fieldPath==='userId'
    && i.fields?.[0]?.order==='ASCENDING'
    && i.fields?.[1]?.fieldPath==='createdAt'
    && i.fields?.[1]?.order==='DESCENDING'));
});
