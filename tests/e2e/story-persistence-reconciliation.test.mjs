import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = readFileSync('functions/src/story-persistence.ts', 'utf8');
const { reconcileStoryPersistence } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);

function fixture(requestData = { userId: 'owner', status: 'processing', providerBudgetStatus: 'settled' }, sessionData) {
  const writes = [];
  const requestRef = { id: 'request' }, sessionRef = { id: 'session' }, deadLetterRef = { id: 'deadletter' };
  const args = {
    db: { runTransaction: async fn => fn({
      get: async ref => { const data = ref === requestRef ? requestData : sessionData; return { exists: !!data, data: () => data }; },
      set: (ref, data) => writes.push({ ref, data })
    }) },
    requestRef, sessionRef, deadLetterRef,
    userId: 'owner', requestId: 'request-id', sessionId: 'session-id',
    reservationId: 'reservation-id', dayId: '2026-09-27', timestamp: '2026-09-27T10:00:00Z'
  };
  return { args, writes };
}

test('lost commit acknowledgement preserves confirmed atomic success', async () => {
  const f = fixture({ userId: 'owner', status: 'succeeded', sessionId: 'session-id' }, { userId: 'owner', requestId: 'request-id' });
  assert.equal(await reconcileStoryPersistence(f.args), true);
  assert.deepEqual(f.writes, []);
});
test('failed commit records terminal hold and metadata only without adjusting settled budget', async () => {
  const f = fixture();
  assert.equal(await reconcileStoryPersistence(f.args), false);
  assert.equal(f.writes.length, 2);
  assert.equal(f.writes[0].data.status, 'requires_reconciliation');
  assert.equal(f.writes[0].data.retryAuthorized, false);
  assert.equal(f.writes[1].data.failureCode, 'story_persistence_failed');
  assert.equal(f.writes[1].data.containsRawStoryContent, false);
  assert.deepEqual(Object.keys(f.writes[1].data).sort(), ['schemaVersion','userId','requestId','reservationId','dayId','sessionId','status','failureCode','containsRawStoryContent','retryAuthorized','createdAt','updatedAt'].sort());
  assert.ok(f.writes.every(w => !('providerBudgetStatus' in w.data) && !('actualCostUsd' in w.data)));
});
test('inconsistent success is investigated without overwriting succeeded request', async () => {
  const f = fixture({ userId: 'owner', status: 'succeeded', sessionId: 'session-id' });
  assert.equal(await reconcileStoryPersistence(f.args), false);
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].ref, f.args.deadLetterRef);
});
test('foreign request cannot be altered', async () => {
  const f = fixture({ userId: 'other', status: 'processing' });
  await assert.rejects(reconcileStoryPersistence(f.args), /persistence_request_unavailable/);
  assert.deepEqual(f.writes, []);
});
test('read failure propagates without writes or provider retry', async () => {
  const f = fixture();
  f.args.db.runTransaction = async fn => fn({ get: async () => { throw new Error('unavailable'); }, set: () => assert.fail('must not write') });
  await assert.rejects(reconcileStoryPersistence(f.args), /unavailable/);
});
test('request claim refuses reconciliation terminal status before fresh claim', () => {
  const runtime = readFileSync('functions/src/storytime.ts', 'utf8');
  const claim = runtime.slice(runtime.indexOf('async function claimGenerationRequest'), runtime.indexOf('async function enforceGenerationQuota'));
  assert.match(claim, /if \(data.status === "requires_reconciliation"\) \{\s*throw new HttpsError\("failed-precondition"/);
});
test('reconciliation transaction failure cannot report persisted success', async () => {
  const f = fixture();
  f.args.db.runTransaction = async fn => {
    await fn({ get: async ref => ({ exists: ref === f.args.requestRef, data: () => ref === f.args.requestRef ? { userId: 'owner', status: 'processing' } : undefined }), set: () => {} });
    throw new Error('transaction commit failed');
  };
  await assert.rejects(reconcileStoryPersistence(f.args), /transaction commit failed/);
});
test('foreign output is never accepted as confirmed success', async () => {
  const f = fixture({ userId: 'owner', status: 'succeeded', sessionId: 'session-id' }, { userId: 'other', requestId: 'request-id' });
  assert.equal(await reconcileStoryPersistence(f.args), false);
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].ref, f.args.deadLetterRef);
});
