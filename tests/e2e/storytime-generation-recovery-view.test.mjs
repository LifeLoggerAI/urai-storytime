import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const recovery = readFileSync('src/components/storytime/StoryGenerationRecovery.tsx','utf8');
const home = readFileSync('src/components/storytime/StorytimeHome.tsx','utf8');
const callable = readFileSync('functions/src/story-generation-recovery.ts','utf8');
const contract = readFileSync('functions/src/story-generation-recovery-contract.ts','utf8');
const indexes = JSON.parse(readFileSync('firestore.indexes.json','utf8'));

test('owner view uses authenticated callable and exact Firebase actor lease', () => {
  assert.match(recovery, /onAuthStateChanged/);
  assert.match(recovery, /captureStorytimeAccountLease/);
  assert.match(recovery, /lease\.isCurrent\(\)/);
  assert.match(recovery, /view\.actor !== getFirebaseAuth\(\)\.currentUser/);
  assert.match(recovery, /getStorytimeGenerationRecovery/);
  assert.match(home, /<StoryGenerationRecovery \/>/);
});

test('interface links only independently validated ready result and never retries', () => {
  assert.match(recovery, /item\.state === "ready" && item\.sessionId/);
  assert.match(recovery, /Open private story/);
  assert.doesNotMatch(recovery, /generateStorySession|setDoc|addDoc|retryStoryGeneration/);
  assert.match(recovery, /not permission to generate again/);
  assert.match(recovery, /Do not resubmit an uncertain request/);
});

test('owner-only backend requires verified email and server-owned scoped lookup', () => {
  assert.match(callable, /request\.auth\?\.uid/);
  assert.match(callable, /email_verified !== true/);
  assert.match(callable, /where\("userId", "==", userId\)/);
  assert.match(callable, /orderBy\("createdAt", "desc"\)/);
  assert.match(callable, /limit\(MAX_RECENT_RECEIPTS\)/);
  assert.match(callable, /isReusableStorytimeSession/);
  assert.match(callable, /retryAuthorized: false/);
});

test('recovery returns no raw story or consent metadata', () => {
  const start = contract.indexOf('return {\n    requestId: record.requestId');
  assert.ok(start !== -1);
  const body = contract.slice(start,contract.indexOf('\n  };',start));
  assert.doesNotMatch(body,/sourceText|sourceSignals|consentSnapshot|providerReceipt|providerInputSha256|reviewedRequestSha256/);
  assert.match(contract, /record\.userId !== ownerUid/);
  assert.match(contract, /record\.sessionId === verifiedOwnedSessionId/);
});

test('requires a composite index and keeps direct client request records denied', () => {
  assert.ok(indexes.indexes.some(i=>i.collectionGroup==='storyGenerationRequests'
    && i.fields?.[0]?.fieldPath==='userId'
    && i.fields?.[1]?.fieldPath==='createdAt'));
  assert.match(readFileSync('firestore.rules','utf8'),
    /match \/storyGenerationRequests\/\{id\} \{ allow read, write: if false; \}/);
});
