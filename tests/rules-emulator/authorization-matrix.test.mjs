import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ref,
  getBytes,
  uploadString,
  deleteObject,
} from 'firebase/storage';

const projectId = 'urai-storytime-authorization-rules-test';
let testEnv;

before(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    readFile(new URL('../../storage.rules', import.meta.url), 'utf8'),
  ]);

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

after(async () => testEnv.cleanup());

async function seedFirestore(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

async function seedStorage(path, body = 'synthetic fixture') {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await uploadString(ref(context.storage(), path), body, 'raw', { contentType: 'text/plain' });
  });
}

test('private Storytime session ownership is enforced and clients cannot mint moderation authority', async () => {
  await seedFirestore('storySessions/session-a', {
    userId: 'ownerUser',
    title: 'Synthetic private story',
    visibility: 'private',
  });

  const owner = testEnv.authenticatedContext('ownerUser').firestore();
  const other = testEnv.authenticatedContext('otherUser').firestore();
  const signedOut = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(owner, 'storySessions/session-a')));
  await assertFails(getDoc(doc(other, 'storySessions/session-a')));
  await assertFails(getDoc(doc(signedOut, 'storySessions/session-a')));
  await assertFails(updateDoc(doc(owner, 'storySessions/session-a'), { title: 'Forged synthetic title' }));
  await assertFails(updateDoc(doc(owner, 'storySessions/session-a'), { safetyStatus: 'approved' }));
  await assertFails(updateDoc(doc(other, 'storySessions/session-a'), { title: 'Cross-owner mutation' }));
});

test('private Storytime bundle records deny cross-user reads', async () => {
  const fixtures = [
    ['storyChapters/chapter-a', { userId: 'ownerUser', sessionId: 'session-a' }],
    ['storyMoments/moment-a', { userId: 'ownerUser', sessionId: 'session-a' }],
    ['memoryScenes/scene-a', { userId: 'ownerUser', sessionId: 'session-a' }],
    ['narratorScripts/script-a', { userId: 'ownerUser', sessionId: 'session-a' }],
    ['emotionalArcSummaries/arc-a', { userId: 'ownerUser', sessionId: 'session-a' }],
  ];
  for (const [path, data] of fixtures) await seedFirestore(path, data);

  const owner = testEnv.authenticatedContext('ownerUser').firestore();
  const other = testEnv.authenticatedContext('otherUser').firestore();

  for (const [path] of fixtures) {
    await assertSucceeds(getDoc(doc(owner, path)));
    await assertFails(getDoc(doc(other, path)));
  }
});

test('generated stories, derived narration, media-job metadata and audit evidence remain server-write-only', async () => {
  const collections = [
    'storySessions', 'storyChapters', 'storyMoments', 'memoryScenes',
    'narratorScripts', 'ritualStorycards', 'storyExports', 'voiceoverJobs',
    'timelineReplayEvents', 'emotionalArcSummaries', 'relationshipStoryThreads',
    'weeklyStoryScrolls', 'monthlyStoryScrolls'
  ];
  const owner = testEnv.authenticatedContext('ownerUser').firestore();
  const other = testEnv.authenticatedContext('otherUser').firestore();
  const admin = testEnv.authenticatedContext('adminUser', { admin: true }).firestore();
  const signedOut = testEnv.unauthenticatedContext().firestore();
  for (const collection of collections) {
    const path = collection + '/synthetic-owner-record';
    await seedFirestore(path, {
      userId: 'ownerUser', sessionId: 'session-a',
      title: 'original synthetic story', status: 'ready',
      consentSnapshot: { voiceover: false, memoryUse: false },
      provenance: { factualStatus: 'creative_derivative_not_source_evidence' },
    });
    await assertSucceeds(getDoc(doc(owner, path)));
    await assertSucceeds(getDoc(doc(admin, path)));
    await assertFails(getDoc(doc(other, path)));
    await assertFails(getDoc(doc(signedOut, path)));
    for (const client of [owner, other, admin, signedOut]) {
      await assertFails(setDoc(doc(client, collection + '/forged-actor-record'), {
        userId: 'ownerUser', sessionId: 'session-a',
        safetyStatus: 'approved', status: 'ready',
      }));
      await assertFails(updateDoc(doc(client, path), {
        'consentSnapshot.voiceover': true,
        'provenance.factualStatus': 'recorded_source_truth',
        title: 'forged synthetic claim'
      }));
      await assertFails(deleteDoc(doc(client, path)));
    }
  }
  await seedFirestore('auditLogs/audit-fixture', { userId: 'ownerUser', event: 'synthetic-test' });
  await assertSucceeds(getDoc(doc(admin, 'auditLogs/audit-fixture')));
  for (const client of [owner, other, admin, signedOut]) {
    await assertFails(setDoc(doc(client, 'auditLogs/forged-audit'), { userId: 'ownerUser', event: 'pretend-authorized' }));
    await assertFails(updateDoc(doc(client, 'auditLogs/audit-fixture'), { event: 'rewritten' }));
    await assertFails(deleteDoc(doc(client, 'auditLogs/audit-fixture')));
  }
});

test('server-only counters, generation receipts, archive snapshots, deletion plans and receipts deny every client', async () => {
  const paths = [
    'storytimeUsageCounters/counter-a',
    'storytimeSafetyReportCounters/counter-a',
    'storytimeProviderBudgetCounters/counter-a',
    'storytimeProviderBudgetReservations/reservation-a',
    'storytimeProviderDeadLetters/deadletter-a',
    'storyGenerationRequests/request-a',
    'storyArchiveSnapshots/archive-a',
    'privacyDeletionPlans/plan-a',
    'privacyOperationReceipts/receipt-a',
  ];
  for (const path of paths) await seedFirestore(path, { userId: 'ownerUser', synthetic: true });

  const owner = testEnv.authenticatedContext('ownerUser').firestore();
  const admin = testEnv.authenticatedContext('adminUser', { admin: true }).firestore();

  for (const path of paths) {
    await assertFails(getDoc(doc(owner, path)));
    await assertFails(getDoc(doc(admin, path)));
    await assertFails(setDoc(doc(owner, path), { userId: 'ownerUser' }));
    await assertFails(setDoc(doc(admin, path), { userId: 'ownerUser' }));
  }
});

test('moderation records are admin-only while clients cannot rewrite Storytime safety fields', async () => {
  await seedFirestore('moderation/mod-a', {
    userId: 'ownerUser',
    requestId: 'request-a',
    status: 'pending',
    containsRawStoryContent: false,
  });

  const owner = testEnv.authenticatedContext('ownerUser').firestore();
  const admin = testEnv.authenticatedContext('adminUser', { admin: true }).firestore();

  await assertFails(getDoc(doc(owner, 'moderation/mod-a')));
  await assertSucceeds(getDoc(doc(admin, 'moderation/mod-a')));
  await assertFails(updateDoc(doc(owner, 'moderation/mod-a'), { status: 'approved' }));
  await assertFails(updateDoc(doc(admin, 'moderation/mod-a'), { status: 'reviewed' }));
  await assertFails(setDoc(doc(admin, 'moderation/client-created'), { status: 'pending' }));
  await assertFails(deleteDoc(doc(admin, 'moderation/mod-a')));
});

test('privacy requests are owner-readable, server-created, and admin-updatable only', async () => {
  await seedFirestore('privacyRequests/privacy-a', {
    userId: 'ownerUser',
    type: 'export',
    scope: 'account',
    status: 'requested',
  });

  const owner = testEnv.authenticatedContext('ownerUser').firestore();
  const other = testEnv.authenticatedContext('otherUser').firestore();
  const admin = testEnv.authenticatedContext('adminUser', { admin: true }).firestore();

  await assertSucceeds(getDoc(doc(owner, 'privacyRequests/privacy-a')));
  await assertFails(getDoc(doc(other, 'privacyRequests/privacy-a')));
  await assertSucceeds(getDoc(doc(admin, 'privacyRequests/privacy-a')));
  await assertFails(setDoc(doc(owner, 'privacyRequests/client-created'), {
    userId: 'ownerUser',
    type: 'export',
    scope: 'account',
  }));
  await assertFails(updateDoc(doc(owner, 'privacyRequests/privacy-a'), { status: 'completed' }));
  await assertSucceeds(updateDoc(doc(admin, 'privacyRequests/privacy-a'), { status: 'processing' }));
  await assertFails(deleteDoc(doc(admin, 'privacyRequests/privacy-a')));
});

test('append-only analytics can be created by owner but cannot be rewritten or deleted', async () => {
  const owner = testEnv.authenticatedContext('ownerUser').firestore();
  const analytics = doc(owner, 'storyAnalyticsEvents/event-a');

  await assertSucceeds(setDoc(analytics, {
    userId: 'ownerUser',
    event: 'synthetic_story_opened',
  }));
  await assertSucceeds(getDoc(analytics));
  await assertFails(updateDoc(analytics, { event: 'rewritten' }));
  await assertFails(deleteDoc(analytics));
});

test('family story storage is claim-scoped and export writes remain admin-only', async () => {
  const ownerStorage = testEnv.authenticatedContext('ownerUser', { familyIds: ['family-a'] }).storage();
  const otherStorage = testEnv.authenticatedContext('otherUser', { familyIds: ['family-b'] }).storage();
  const adminStorage = testEnv.authenticatedContext('adminUser', { admin: true }).storage();

  const storyPath = 'families/family-a/stories/story-a/page.txt';
  await assertSucceeds(uploadString(ref(ownerStorage, storyPath), 'synthetic story asset'));
  await assertSucceeds(getBytes(ref(ownerStorage, storyPath)));
  await assertFails(getBytes(ref(otherStorage, storyPath)));
  await assertSucceeds(getBytes(ref(adminStorage, storyPath)));

  const exportPath = 'families/family-a/exports/export.json';
  await assertFails(uploadString(ref(ownerStorage, exportPath), '{"synthetic":true}'));
  await assertSucceeds(uploadString(ref(adminStorage, exportPath), '{"synthetic":true}'));
  await assertSucceeds(getBytes(ref(ownerStorage, exportPath)));
});

test('moderation storage and unknown storage paths fail closed', async () => {
  await seedStorage('moderation/review-a.txt');
  const ownerStorage = testEnv.authenticatedContext('ownerUser', { familyIds: ['family-a'] }).storage();
  const adminStorage = testEnv.authenticatedContext('adminUser', { admin: true }).storage();

  await assertFails(getBytes(ref(ownerStorage, 'moderation/review-a.txt')));
  await assertSucceeds(getBytes(ref(adminStorage, 'moderation/review-a.txt')));
  await assertFails(uploadString(ref(ownerStorage, 'moderation/client.txt'), 'no'));
  await assertSucceeds(uploadString(ref(adminStorage, 'moderation/admin.txt'), 'synthetic'));
  await assertFails(uploadString(ref(ownerStorage, 'unknown/path.txt'), 'no'));
  await assertFails(getBytes(ref(ownerStorage, 'unknown/path.txt')));
  await assertFails(deleteObject(ref(ownerStorage, 'moderation/review-a.txt')));
});


test('safety reports are owner-readable and audit records admin-readable, but all writes are server-owned', async () => {
  await seedFirestore('storySafetyReports/report-a', { userId: 'ownerUser', category: 'privacy_concern' });
  await seedFirestore('moderationAuditLogs/audit-a', { userId: 'ownerUser', action: 'close_blocked' });
  const owner = testEnv.authenticatedContext('ownerUser').firestore();
  const other = testEnv.authenticatedContext('otherUser').firestore();
  const admin = testEnv.authenticatedContext('adminUser', { admin: true }).firestore();
  const signedOut = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(owner, 'storySafetyReports/report-a')));
  await assertSucceeds(getDoc(doc(admin, 'storySafetyReports/report-a')));
  await assertFails(getDoc(doc(other, 'storySafetyReports/report-a')));
  await assertFails(getDoc(doc(signedOut, 'storySafetyReports/report-a')));
  await assertSucceeds(getDoc(doc(admin, 'moderationAuditLogs/audit-a')));
  await assertFails(getDoc(doc(owner, 'moderationAuditLogs/audit-a')));
  for (const db of [owner, other, admin, signedOut]) {
    for (const path of ['storySafetyReports/report-a', 'moderationAuditLogs/audit-a']) {
      await assertFails(setDoc(doc(db, path), { userId: 'ownerUser' }));
      await assertFails(updateDoc(doc(db, path), { status: 'completed' }));
      await assertFails(deleteDoc(doc(db, path)));
    }
  }
});
