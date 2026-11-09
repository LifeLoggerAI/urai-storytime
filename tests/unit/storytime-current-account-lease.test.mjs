import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync('src/lib/storytime/current-account-lease.ts', 'utf8');
const { captureStorytimeAccountLease } = await import(
  'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64')
);

test('exact actor object and epoch permit the current private read only', () => {
  const a = { uid: 'synthetic-a' };
  let actor = a, epoch = 2;
  const lease = captureStorytimeAccountLease(a, epoch, () => actor, () => epoch);
  assert.equal(lease.isCurrent(), true);
  actor = { uid: 'synthetic-b' };
  assert.equal(lease.isCurrent(), false);
});

test('same UID under a different Firebase User object cannot settle an old read', () => {
  const a = { uid: 'synthetic-same-uid' };
  let actor = a, epoch = 3;
  const lease = captureStorytimeAccountLease(a, epoch, () => actor, () => epoch);
  actor = { uid: a.uid };
  assert.equal(lease.isCurrent(), false);
});

test('auth notification epoch invalidates a stale result even when actor identity is unchanged', () => {
  const a = { uid: 'synthetic-a' };
  let epoch = 4;
  const lease = captureStorytimeAccountLease(a, epoch, () => a, () => epoch);
  epoch++;
  assert.equal(lease.isCurrent(), false);
});

test('missing actor has no current private read authority', () => {
  const lease = captureStorytimeAccountLease(null, 0, () => null, () => 0);
  assert.equal(lease.isCurrent(), false);
});

test('private lists recheck the lease on both async success and error and bind rendered data to exact actor', () => {
  for (const file of [
    'src/components/storytime/SessionLibrary.tsx',
    'src/components/storytime/DraftLibrary.tsx'
  ]) {
    const body = readFileSync(file, 'utf8');
    assert.match(body, /captureStorytimeAccountLease/);
    assert.match(body, /authEpoch \+= 1/);
    assert.match(body, /if \(!actorLease\.isCurrent\(\)\) return;/);
    assert.match(body, /state\.user !== getFirebaseAuth\(\)\.currentUser/);
    assert.match(body, /status: "loading"/);
  }
});
