import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const raw = readFileSync('functions/src/story-generation-admission.ts', 'utf8');
const { isClearedStorytimeAdmissionGuard, heldStorytimeAdmissionRecord } = await import(
  'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(raw)).toString('base64')
);
const callable = readFileSync('functions/src/storytime.ts', 'utf8');
const rules = readFileSync('firestore.rules', 'utf8');
const SHA = 'a'.repeat(64);
const SHA2 = 'b'.repeat(64);
const date = '2026-11-08T20:00:00.000Z';

const cleared = {
  schemaVersion: 'storytime-generation-admission-v1', userId: 'synthetic-A',
  state: 'ready', activeRequestId: null,
  legacyRequestsReconciled: true, providerChargesReconciled: true,
  clearanceReceiptSha256: SHA
};

test('missing or legacy guard fails closed before first admission', () => {
  assert.equal(isClearedStorytimeAdmissionGuard(null,'synthetic-A'),false);
  assert.equal(isClearedStorytimeAdmissionGuard({},'synthetic-A'),false);
  assert.equal(isClearedStorytimeAdmissionGuard({state:'ready'},'synthetic-A'),false);
});

test('owner and valid clearance are both mandatory', () => {
  assert.equal(isClearedStorytimeAdmissionGuard(cleared,'synthetic-A'),true);
  assert.equal(isClearedStorytimeAdmissionGuard(cleared,'synthetic-B'),false);
  assert.equal(isClearedStorytimeAdmissionGuard({...cleared,userId:'synthetic-B'},'synthetic-A'),false);
});

test('provider and legacy reconciliation may never be inferred', () => {
  for(const delta of [
    {legacyRequestsReconciled:false},{providerChargesReconciled:false},
    {clearanceReceiptSha256:null},{clearanceReceiptSha256:'not-a-digest'},
    {state:'held'},{activeRequestId:'another-request-123'},
    {schemaVersion:'storytime-generation-admission-v0'}
  ]) {
    assert.equal(isClearedStorytimeAdmissionGuard({...cleared,...delta},'synthetic-A'),false);
  }
});

test('admission moves ready to held and strips prior release evidence', () => {
  const held=heldStorytimeAdmissionRecord('synthetic-A','request-12345',SHA,SHA2,date);
  assert.equal(held.state,'held');
  assert.equal(held.activeRequestId,'request-12345');
  assert.equal(held.legacyRequestsReconciled,false);
  assert.equal(held.providerChargesReconciled,false);
  assert.equal(held.clearanceReceiptSha256,null);
  assert.equal(isClearedStorytimeAdmissionGuard(held,'synthetic-A'),false);
  assert.equal(held.reviewedRequestSha256,SHA);
  assert.equal(held.providerInputSha256,SHA2);
});

test('invalid IDs, fingerprints and timestamps are rejected', () => {
  for(const requestId of ['','x','../bad','x'.repeat(129)]) {
    assert.throws(()=>heldStorytimeAdmissionRecord('synthetic-A',requestId,SHA,SHA2,date));
  }
  assert.throws(()=>heldStorytimeAdmissionRecord('synthetic-A','request-12345','bad',SHA2,date));
  assert.throws(()=>heldStorytimeAdmissionRecord('synthetic-A','request-12345',SHA,'bad',date));
  assert.throws(()=>heldStorytimeAdmissionRecord('synthetic-A','request-12345',SHA,SHA2,'not-a-date'));
});

test('one owner-scoped guard and generation request are written in same transaction', () => {
  const start=callable.indexOf('async function claimGenerationRequest(');
  const end=callable.indexOf('async function enforceGenerationQuota(',start);
  assert.ok(start>=0&&end>start);
  const claim=callable.slice(start,end);
  assert.match(claim,/db\.collection\("storytimeGenerationAdmissionGuards"\)\.doc\(userId\)/);
  assert.match(claim,/const guardSnapshot = await transaction\.get\(admissionRef\)/);
  assert.match(claim,/if \(!isClearedStorytimeAdmissionGuard\(guardSnapshot\.data\(\), userId\)\)/);
  assert.match(claim,/transaction\.set\(admissionRef, heldStorytimeAdmissionRecord/);
  assert.match(claim,/transaction\.set\(requestRef,/);
  const read=claim.indexOf('const guardSnapshot = await transaction.get(admissionRef)');
  const fence=claim.indexOf('transaction.set(admissionRef');
  const create=claim.indexOf('transaction.set(requestRef');
  assert.ok(read<fence && fence<create);
});

test('previous request ID handling retains exact source, original session and no fresh provider attempt', () => {
  const claim=callable.slice(callable.indexOf('async function claimGenerationRequest('),callable.indexOf('async function enforceGenerationQuota('));
  assert.match(claim,/sameStorytimeGenerationBinding/);
  assert.match(claim,/isReusableStorytimeSession/);
  assert.match(claim,/if \(data\.status === "processing"\)/);
  assert.match(claim,/No existing claim can be overwritten for another provider attempt/);
  assert.ok(claim.indexOf('if (snapshot.exists)')<claim.indexOf('const guardSnapshot'));
});

test('admission guard and request collection are denied to all client Rules', () => {
  assert.match(rules,/match \/storytimeGenerationAdmissionGuards\/\{id\} \{ allow read, write: if false; \}/);
  assert.match(rules,/match \/storyGenerationRequests\/\{id\} \{ allow read, write: if false; \}/);
});

test('no automatic lock clearance exists in generation, cancellation or spend path', () => {
  assert.doesNotMatch(callable,/transaction\.(delete|update)\(admissionRef/);
  assert.doesNotMatch(callable,/admissionRef\.(delete|update)/);
  assert.match(callable,/storytimeGenerationAdmissionGuards/);
});
