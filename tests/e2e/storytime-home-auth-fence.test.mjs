import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');
const leaseSource = readFileSync('src/lib/storytime/current-account-lease.ts', 'utf8');
const { captureStorytimeAccountLease } = await import(
  'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(leaseSource)).toString('base64')
);

test('StorytimeHome observes auth on plain create route, not only when a draft query param is present', () => {
  const start = source.indexOf('useEffect(() => {');
  const end = source.indexOf('const unsubscribe = onAuthStateChanged(auth, async (user) =>', start);
  const beforeAuth = source.slice(start, end);
  assert.ok(end > start);
  assert.doesNotMatch(beforeAuth, /if \(!requestedDraftId\) return undefined/);
  const observed = source.slice(end, source.indexOf('return () => {', end));
  assert.match(observed, /if \(!requestedDraftId\) \{/);
  assert.match(observed, /authEpoch\.current \+= 1/);
  assert.match(observed, /activeActor\.current = user/);
  assert.ok(observed.includes("clearResumedDraft()"));
});

test('account changes clear protected form content and all provider or generation approvals', () => {
  const reset = source.slice(source.indexOf('const clearResumedDraft ='), source.indexOf('const unsubscribe = onAuthStateChanged'));
  for (const statement of [
    'setTitle("")', 'setTheme("")', 'setSourceText("")',
    'setAdultGuardianAffirmed(false)', 'setGenerationConsent(false)',
    'setProviderProcessingConsent(false)', 'setReviewedFingerprint(null)',
    'setDraftStorageConsent(false)', 'setDraftId(null)', 'setDraftRevision(0)',
    'setLastSavedDraftFingerprint(null)', 'setDraftSaving(false)',
    'setIsSubmitting(false)'
  ]) assert.ok(reset.includes(statement), 'missing account-switch reset: ' + statement);
  assert.match(source, /formActor !== getFirebaseAuth\(\)\.currentUser/);
  assert.match(source, /activeActor\.current !== getFirebaseAuth\(\)\.currentUser/);
});

test('autosave, deletion, and generation refuse stale asynchronous completions', () => {
  const autosave = source.slice(source.indexOf('const timer = window.setTimeout'),source.indexOf('return () => window.clearTimeout(timer)'));
  assert.match(autosave, /if \(!isCurrent\(\)\) return;\s*const result = await saveDraft/s);
  assert.match(autosave, /if \(!isCurrent\(\)\) return;\s*if \(!result\.data\.draftId/s);
  assert.match(autosave, /if \(isCurrent\(\)\) setDraftSaving\(false\)/);
  const del = source.slice(source.indexOf('async function handleDeleteDraft'),source.indexOf('const validationError = useMemo'));
  assert.match(del, /await deleteDraft\(\{ draftId \}\);\s*if \(!isCurrent\(\)\) return/s);
  const submit = source.slice(source.indexOf('async function handleCreateStory'),source.indexOf('// The Auth SDK can change accounts'));
  assert.match(submit, /if \(!isCurrent\(\)\) return;\s*if \(!result\.data\.sessionId/s);
  assert.match(submit, /if \(isCurrent\(\)\) window\.location\.assign/);
  assert.match(submit, /if \(isCurrent\(\)\) setSubmitError\(errorMessage\(\)\)/);
});

test('source actor lease rejects other account, same UID new User, and stale epoch', () => {
  const initial = {uid:'owner-a'}, sameUidNewObject = {uid:'owner-a'};
  let actor = initial, epoch = 1;
  const lease = captureStorytimeAccountLease(initial, epoch, () => actor, () => epoch);
  assert.equal(lease.isCurrent(), true);
  actor = sameUidNewObject;
  assert.equal(lease.isCurrent(), false);
  actor = initial; epoch++;
  assert.equal(lease.isCurrent(), false);
});
