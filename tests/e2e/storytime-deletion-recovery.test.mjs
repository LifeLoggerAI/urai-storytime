import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fixture, callables, ownerRequest, adminRequest, request } from '../helpers/storytime-privacy-fixture.mjs';

const execute = (c, plan) => c.executeStorytimeDeletion(adminRequest({ privacyRequestId: 'privacy', expectedPlanHash: plan.planHash, confirmation: 'DELETE_STORYTIME_DATA' }));
const currentRequest = f => f.records.get('privacyRequests/privacy');
const storagePrefix = `storytime-exports/${createHash('sha256').update('owner').digest('hex')}/`;

test('withdrawal during plan persistence wins over the old planner update', async () => {
  const f = fixture(); request(f, 'deletion', 'story_session'); const c = await callables(f);
  const originalCollection = f.db.collection;
  f.db.collection = name => {
    const collection = originalCollection(name);
    if (name !== 'privacyDeletionPlans') return collection;
    return { ...collection, doc: id => {
      const ref = collection.doc(id);
      return { ...ref, set: async value => {
        f.put('privacyRequests/privacy', { ...currentRequest(f), status: 'cancelled' });
        return ref.set(value);
      } };
    } };
  };
  await assert.rejects(c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' })), error => error.code === 'failed-precondition');
  assert.equal(currentRequest(f).status, 'cancelled');
  assert.equal(f.records.has('storySessions/session'), true);
});

test('owner planning cannot replace a currently executing admin plan', async () => {
  const f = fixture(); request(f, 'deletion', 'story_session');
  f.put('privacyRequests/privacy', { ...currentRequest(f), executionState: 'executing' });
  const c = await callables(f);
  await assert.rejects(c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' })), error => error.code === 'failed-precondition');
  assert.equal([...f.records.keys()].filter(path => path.startsWith('privacyDeletionPlans/')).length, 0);
});
async function setup(scope = 'story_session', beforePlan = () => {}) {
  const f = fixture(); request(f, 'deletion', scope); beforePlan(f);
  const c = await callables(f);
  const plan = await c.planStorytimeDeletion(ownerRequest({ privacyRequestId: 'privacy' }));
  return { f, c, plan };
}
async function partialSession() {
  const state = await setup(); state.f.hooks.failDelete = 'storyVersions';
  await assert.rejects(execute(state.c, state.plan), error => error.code === 'internal');
  assert.equal(state.f.records.has('storySessions/session'), false);
  assert.equal(state.f.records.has('storyVersions/version'), true);
  assert.equal(currentRequest(state.f).executionState, 'retry_required');
  return state;
}

test('an approved session deletion resumes exact children after the parent batch was deleted', async () => {
  const { f, c, plan } = await partialSession();
  const result = await execute(c, plan);
  assert.equal(result.executionState, 'verification_required');
  assert.equal(f.records.has('storyVersions/version'), false);
  assert.equal(f.records.has('storyVersions/foreign'), true);
  assert.equal(currentRequest(f).deletionCompletionVerified, false);
  assert.equal(currentRequest(f).completionReceiptId, null);
});

test('1001 approved private versions resume across successful and failed 400-record transactions', async () => {
  const { f, c, plan } = await setup('story_session', f => {
    for (let i = 0; i < 1000; i++) f.put(`storyVersions/large-${String(i).padStart(4, '0')}`, { userId: 'owner', sessionId: 'session', synthetic: i });
  });
  let versionCommits = 0;
  f.hooks.beforeDeleteCommit = deletes => {
    if (deletes.some(item => item.path.startsWith('storyVersions/')) && ++versionCommits === 2) f.hooks.failDelete = 'storyVersions';
  };
  await assert.rejects(execute(c, plan), error => error.code === 'internal');
  assert.equal([...f.records].filter(([path, value]) => path.startsWith('storyVersions/') && value.userId === 'owner').length, 601);
  f.hooks.beforeDeleteCommit = null;
  await execute(c, plan);
  assert.equal([...f.records].filter(([path, value]) => path.startsWith('storyVersions/') && value.userId === 'owner').length, 0);
  assert.equal(currentRequest(f).executionState, 'verification_required');
});

for (const failure of ['storage', 'auth', 'receipt']) {
  test(`account deletion resumes approved residual work after ${failure} failure without completing early`, async () => {
    const prior = process.env.STORYTIME_FIREBASE_ISOLATED; process.env.STORYTIME_FIREBASE_ISOLATED = 'true';
    try {
      const { f, c, plan } = await setup('account', f => f.putFile(`${storagePrefix}old/export.json`, '{}', '17'));
      f.hooks[`fail${failure[0].toUpperCase()}${failure.slice(1)}`] = 1;
      await assert.rejects(execute(c, plan), error => error.code === 'internal');
      assert.equal(f.records.has('storySessions/session'), false);
      assert.equal(currentRequest(f).executionState, 'retry_required');
      assert.equal(currentRequest(f).deletionCompletionVerified, false);
      const result = await execute(c, plan);
      assert.equal(result.executionState, 'verification_required');
      assert.equal(f.files.size, 0);
      await assert.rejects(f.auth.getUser('owner'), error => error.code === 'auth/user-not-found');
      assert.equal(currentRequest(f).completionReceiptId, null);
    } finally { if (prior === undefined) delete process.env.STORYTIME_FIREBASE_ISOLATED; else process.env.STORYTIME_FIREBASE_ISOLATED = prior; }
  });
}

test('admin recovery preserves original moderation targets whose session metadata was deleted', async () => {
  const { f, c, plan } = await setup('story_session', f => f.put('moderation/approved', { userId: 'owner', requestId: 'request' }));
  f.hooks.failDelete = 'moderation'; await assert.rejects(execute(c, plan));
  assert.equal(f.records.has('storySessions/session'), false);
  assert.equal(f.records.has('moderation/approved'), true);
  await execute(c, plan);
  assert.equal(f.records.has('moderation/approved'), false);
});

for (const change of ['new', 'corrected', 'foreign', 'rewritten']) {
  test(`recovery refuses a ${change} target instead of extending the approved source identity`, async () => {
    const { f, c, plan } = await partialSession();
    if (change === 'new') f.put('storyVersions/new', { userId: 'owner', sessionId: 'session' });
    else if (change === 'corrected') f.put('storyVersions/version', { ...f.records.get('storyVersions/version'), correction: true });
    else if (change === 'foreign') f.put('storyVersions/version', { userId: 'different-owner', sessionId: 'different-session' });
    else f.put('storyVersions/version', f.records.get('storyVersions/version'));
    await assert.rejects(execute(c, plan), error => error.code === 'failed-precondition');
    assert.equal(f.records.has('storyVersions/version'), true);
    assert.equal(currentRequest(f).deletionCompletionVerified, false);
  });
}

test('recovery refuses a re-created foreign parent', async () => {
  const { f, c, plan } = await partialSession(); f.put('storySessions/session', { userId: 'different-owner' });
  await assert.rejects(execute(c, plan), error => error.code === 'permission-denied');
  assert.equal(f.records.has('storyVersions/version'), true);
});

for (const field of ['userId', 'scope', 'sessionId', 'confirmation', 'createdAt', 'status']) {
  test(`recovery refuses current request ${field} rebinding or revocation`, async () => {
    const { f, c, plan } = await partialSession();
    const replacements = { userId: 'different-owner', scope: 'account', sessionId: 'other', confirmation: false, createdAt: '2026-01-01T00:00:00.000Z', status: 'cancelled' };
    f.put('privacyRequests/privacy', { ...currentRequest(f), [field]: replacements[field] });
    await assert.rejects(execute(c, plan), error => error.code === 'failed-precondition');
    assert.equal(f.records.has('storyVersions/version'), true);
    assert.equal(currentRequest(f)[field], replacements[field]);
  });
}

test('a synthetic retry state without an exact started-plan authority cannot delete missing-parent children', async () => {
  const { f, c, plan } = await setup(); f.put('storySessions/session', undefined);
  f.put('privacyRequests/privacy', { ...currentRequest(f), executionState: 'retry_required' });
  await assert.rejects(execute(c, plan), error => error.code === 'failed-precondition');
  assert.equal(f.records.has('storyVersions/version'), true);
});

test('an active execution lease refuses a competing admin attempt', async () => {
  const { f, c, plan } = await partialSession();
  f.put('privacyRequests/privacy', { ...currentRequest(f), executionState: 'executing', destructiveExecutionLeaseExpiresAt: new Date(Date.now() + 60_000).toISOString() });
  await assert.rejects(execute(c, plan), error => error.code === 'failed-precondition');
  assert.equal(f.records.has('storyVersions/version'), true);
});

test('an expired exact-plan lease permits governed crash recovery', async () => {
  const { f, c, plan } = await partialSession();
  f.put('privacyRequests/privacy', { ...currentRequest(f), executionState: 'executing', destructiveExecutionLeaseExpiresAt: new Date(Date.now() - 1).toISOString() });
  await execute(c, plan); assert.equal(f.records.has('storyVersions/version'), false);
});

test('a record corrected after validation cannot be erased by a stale atomic transaction', async () => {
  const { f, c, plan } = await setup();
  f.hooks.beforeDeleteCommit = deletes => {
    if (deletes.some(item => item.path === 'storyVersions/version')) {
      f.hooks.beforeDeleteCommit = null;
      f.put('storyVersions/version', { ...f.records.get('storyVersions/version'), correction: 'during-await' });
    }
  };
  await assert.rejects(execute(c, plan), error => error.code === 'internal');
  assert.equal(f.records.get('storyVersions/version').correction, 'during-await');
  assert.equal(currentRequest(f).executionState, 'retry_required');
});

test('request cancellation beats a stale mutation and its failure update', async () => {
  const { f, c, plan } = await setup();
  f.hooks.beforeDeleteCommit = () => {
    f.hooks.beforeDeleteCommit = null;
    f.put('privacyRequests/privacy', { ...currentRequest(f), status: 'cancelled' });
  };
  await assert.rejects(execute(c, plan), error => error.code === 'internal');
  assert.equal(currentRequest(f).status, 'cancelled');
  assert.equal(f.records.has('storyVersions/version'), true);
});

for (const field of ['uid', 'userId']) {
  test(`legal hold ${field} lookup inspects beyond both the old 25 limit and a 400-row page`, async () => {
    const { f, plan } = await setup('story_session', f => {
      for (let i = 0; i < 401; i++) f.put(`legalHoldRecords/hold-${String(i).padStart(4, '0')}`, { [field]: 'owner', status: 'inactive' });
      f.put('legalHoldRecords/hold-9999', { [field]: 'owner', status: 'active' });
    });
    assert.ok(plan.executionBlockers.includes('active_legal_hold'));
    assert.equal(plan.readyForAdminExecution, false);
    assert.equal(f.records.has('storyVersions/version'), true);
  });
}

test('a new legal hold during partial failure blocks recovery without erasing the remaining child', async () => {
  const { f, c, plan } = await partialSession();
  f.put('legalHoldRecords/new-hold', { uid: 'owner', status: 'active' });
  await assert.rejects(execute(c, plan), error => error.code === 'failed-precondition');
  assert.equal(f.records.has('storyVersions/version'), true);
});

test('a new legal hold is rechecked before the next transaction', async () => {
  const { f, c, plan } = await setup();
  f.hooks.beforeDeleteCommit = deletes => {
    if (deletes.some(item => item.path === 'storySessions/session')) {
      f.hooks.beforeDeleteCommit = null;
      f.put('legalHoldRecords/new-hold', { uid: 'owner', status: 'active' });
    }
  };
  await assert.rejects(execute(c, plan), error => error.code === 'internal');
  assert.equal(f.records.has('storyVersions/version'), true);
});

test('new family membership blocks account recovery', async () => {
  const prior = process.env.STORYTIME_FIREBASE_ISOLATED; process.env.STORYTIME_FIREBASE_ISOLATED = 'true';
  try {
    const { f, c, plan } = await setup('account'); f.hooks.failAuth = 1; await assert.rejects(execute(c, plan));
    f.put('families/new', { members: { owner: { role: 'guardian' } } });
    await assert.rejects(execute(c, plan), error => error.code === 'failed-precondition');
    assert.equal(currentRequest(f).deletionCompletionVerified, false);
  } finally { if (prior === undefined) delete process.env.STORYTIME_FIREBASE_ISOLATED; else process.env.STORYTIME_FIREBASE_ISOLATED = prior; }
});

for (const replacement of ['storage', 'auth']) {
  test(`account recovery refuses a replaced ${replacement} identity`, async () => {
    const prior = process.env.STORYTIME_FIREBASE_ISOLATED; process.env.STORYTIME_FIREBASE_ISOLATED = 'true';
    try {
      const path = `${storagePrefix}old/export.json`;
      const { f, c, plan } = await setup('account', f => f.putFile(path, '{}', '17'));
      f.hooks.failStorage = 1; await assert.rejects(execute(c, plan));
      if (replacement === 'storage') f.putFile(path, '{}', '18'); else f.replaceAuth();
      await assert.rejects(execute(c, plan), error => error.code === 'failed-precondition');
      assert.equal(f.files.has(path), true);
    } finally { if (prior === undefined) delete process.env.STORYTIME_FIREBASE_ISOLATED; else process.env.STORYTIME_FIREBASE_ISOLATED = prior; }
  });
}

test('a storage generation replaced after validation survives its conditional delete', async () => {
  const prior = process.env.STORYTIME_FIREBASE_ISOLATED; process.env.STORYTIME_FIREBASE_ISOLATED = 'true';
  try {
    const path = `${storagePrefix}old/export.json`;
    const { f, c, plan } = await setup('account', f => f.putFile(path, '{}', '17'));
    f.hooks.beforeStorageDelete = () => { f.hooks.beforeStorageDelete = null; f.putFile(path, '{"replacement":true}', '18'); };
    await assert.rejects(execute(c, plan), error => error.code === 'internal');
    assert.equal(f.files.get(path), '{"replacement":true}');
    assert.equal(currentRequest(f).deletionCompletionVerified, false);
  } finally { if (prior === undefined) delete process.env.STORYTIME_FIREBASE_ISOLATED; else process.env.STORYTIME_FIREBASE_ISOLATED = prior; }
});
