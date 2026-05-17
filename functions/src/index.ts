import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

const db = getFirestore();

function requireAuth(uid?: string) {
  if (!uid) throw new HttpsError('unauthenticated', 'Please sign in.');
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const blocked = [
  'violence', 'blood', 'weapon', 'gun', 'knife', 'abuse', 'hate', 'kill', 'murder',
  'suicide', 'self-harm', 'sex', 'nude', 'drugs', 'alcohol', 'grooming', 'kidnap',
  'ignore safety', 'bypass rules', 'system prompt', 'home address', 'school name'
];

function safetyCheck(text: string) {
  const lower = text.toLowerCase();
  const hits = blocked.filter((word) => lower.includes(word));
  return {
    safe: hits.length === 0,
    classification: hits.length === 0 ? 'safe' : hits.length > 2 ? 'needs_review' : 'blocked',
    blockedReasons: hits,
    parentMessage: hits.length === 0
      ? 'This passed the safety check.'
      : 'That idea needs a softer bedtime version. Try friendship, courage, wonder, or rest.'
  };
}

function localStory(data: Record<string, unknown>) {
  const child = String(data.childDisplayName || 'Ari').slice(0, 32);
  const theme = String(data.theme || 'Moon Garden').slice(0, 80);
  const narrator = String(data.narratorId || 'Gentle Firefly').replaceAll('_', ' ');
  return [
    `Tonight, ${child} stepped into the ${theme}, where the moon painted every leaf silver.`,
    `${narrator} floated nearby and promised that every path would stay gentle and safe.`,
    `Together they helped a shy star find its glow, shared kindness with a sleepy cloud, and listened to the quiet music of the sky.`,
    `When the adventure was done, ${child} carried a small spark of courage home.`,
    `The room grew soft, the night grew calm, and ${child} felt loved, safe, and ready to rest.`
  ].join(' ');
}

function splitScenes(storyId: string, familyId: string, body: string, mood: string, theme: string) {
  const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunkSize = Math.max(1, Math.ceil(sentences.length / 4));
  return Array.from({ length: Math.ceil(sentences.length / chunkSize) }).map((_, index) => {
    const text = sentences.slice(index * chunkSize, (index + 1) * chunkSize).join(' ');
    return {
      id: `${storyId}_scene_${index + 1}`,
      storyId,
      familyId,
      index,
      title: `Scene ${index + 1}`,
      text,
      emotion: mood,
      motif: index === 0 ? 'moonlit doorway' : 'soft glowing companion',
      visualPrompt: `Gentle magical children's book illustration of ${theme}, ${mood} mood, soft bedtime lighting, safe and comforting.`,
      captionStartMs: index * 40000,
      captionEndMs: index * 40000 + Math.max(24000, text.length * 70)
    };
  });
}

async function assertFamilyMember(familyId: string, uid: string) {
  const familySnap = await db.collection('families').doc(familyId).get();
  if (!familySnap.exists || !familySnap.data()?.memberUserIds?.includes(uid)) {
    throw new HttpsError('permission-denied', 'You do not have access to this family.');
  }
}

export const generateStory = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const data = request.data || {};
  const familyId = String(data.familyId || '');
  const childProfileId = String(data.childProfileId || '');
  if (!familyId || !childProfileId) throw new HttpsError('invalid-argument', 'familyId and childProfileId are required.');
  await assertFamilyMember(familyId, request.auth!.uid);

  const requestId = id('request');
  const runId = id('run');
  const storyId = id('story');
  const now = new Date().toISOString();
  const pre = safetyCheck([data.childDisplayName, data.theme, data.mood, data.prompt].join(' '));

  await db.collection('storyRequests').doc(requestId).set({
    id: requestId,
    familyId,
    childProfileId,
    requestedByUserId: request.auth!.uid,
    ...data,
    status: pre.safe ? 'approved' : 'blocked',
    createdAt: now
  });

  const precheckId = id('safety_pre');
  await db.collection('safetyReviews').doc(precheckId).set({
    id: precheckId,
    familyId,
    targetType: 'prompt',
    targetId: requestId,
    ageBand: data.ageBand || 'early_reader_6_8',
    classification: pre.classification,
    blockedReasons: pre.blockedReasons,
    reviewStatus: pre.safe ? 'auto_approved' : 'auto_blocked',
    createdAt: now
  });

  if (!pre.safe) {
    await db.collection('moderationEvents').doc(id('mod')).set({
      familyId,
      targetType: 'prompt',
      targetId: requestId,
      status: 'pending',
      reason: pre.blockedReasons.join(', '),
      severity: pre.blockedReasons.length > 2 ? 'high' : 'medium',
      createdAt: now
    });
    return { status: 'blocked', parentMessage: pre.parentMessage, blockedReasons: pre.blockedReasons };
  }

  const body = localStory(data);
  const post = safetyCheck(body);
  const postcheckId = id('safety_post');
  await db.collection('safetyReviews').doc(postcheckId).set({
    id: postcheckId,
    familyId,
    targetType: 'story',
    targetId: storyId,
    ageBand: data.ageBand || 'early_reader_6_8',
    classification: post.classification,
    blockedReasons: post.blockedReasons,
    reviewStatus: post.safe ? 'auto_approved' : 'auto_blocked',
    createdAt: now
  });

  if (!post.safe) {
    await db.collection('storyRuns').doc(runId).set({ id: runId, requestId, familyId, provider: 'local_demo', status: 'blocked', safetyPrecheckId: precheckId, safetyPostcheckId: postcheckId, createdAt: now, completedAt: now });
    await db.collection('moderationEvents').doc(id('mod')).set({ familyId, targetType: 'story', targetId: storyId, status: 'pending', reason: post.blockedReasons.join(', '), severity: 'medium', createdAt: now });
    return { status: 'blocked', parentMessage: post.parentMessage, blockedReasons: post.blockedReasons };
  }

  const scenes = splitScenes(storyId, familyId, body, data.mood || 'gentle', data.theme || 'Moon Garden');
  await db.collection('storyRuns').doc(runId).set({ id: runId, requestId, familyId, provider: 'local_demo', status: 'complete', safetyPrecheckId: precheckId, safetyPostcheckId: postcheckId, createdAt: now, completedAt: now });
  const story = {
    id: storyId,
    familyId,
    childProfileId,
    storyRunId: runId,
    title: `${data.childDisplayName || 'Ari'}'s ${data.theme || 'Moon Garden'} Story`,
    summary: `${data.mood || 'gentle'} story about ${data.theme || 'Moon Garden'}`,
    body,
    scenes,
    narratorId: data.narratorId || 'gentle_firefly',
    mood: data.mood || 'gentle',
    theme: data.theme || 'Moon Garden',
    safetyReviewId: postcheckId,
    status: 'ready',
    visibility: 'private',
    createdAt: now,
    updatedAt: now
  };
  await db.collection('stories').doc(storyId).set(story);
  for (const scene of scenes) await db.collection('storyScenes').doc(scene.id).set(scene);
  await db.collection('analyticsEvents').doc(id('evt')).set({ name: 'story_create_completed', familyId, userId: request.auth!.uid, metadata: { sceneCount: scenes.length }, createdAt: FieldValue.serverTimestamp() });
  return { status: 'ready', story };
});

export const createNarrationJob = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const { familyId, storyId, narratorId } = request.data || {};
  if (!familyId || !storyId) throw new HttpsError('invalid-argument', 'familyId and storyId are required.');
  await assertFamilyMember(String(familyId), request.auth!.uid);
  const hasTts = Boolean(process.env.TTS_API_KEY);
  const jobId = id('narration');
  const job = {
    id: jobId,
    familyId,
    storyId,
    narratorId: narratorId || 'gentle_firefly',
    provider: hasTts ? 'tts_provider' : 'web_speech',
    status: hasTts ? 'queued' : 'complete',
    audioAssetIds: [],
    createdAt: new Date().toISOString(),
    completedAt: hasTts ? null : new Date().toISOString()
  };
  await db.collection('narrationJobs').doc(jobId).set(job);
  return job;
});

export const requestPrivacyExport = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const { familyId } = request.data || {};
  if (!familyId) throw new HttpsError('invalid-argument', 'familyId is required.');
  await assertFamilyMember(String(familyId), request.auth!.uid);
  const requestId = id('privacy_export');
  await db.collection('privacyRequests').doc(requestId).set({ id: requestId, familyId, requestedByUserId: request.auth!.uid, type: 'export', status: 'queued', createdAt: new Date().toISOString() });
  return { status: 'queued', requestId };
});

export const requestPrivacyDelete = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const { familyId } = request.data || {};
  if (!familyId) throw new HttpsError('invalid-argument', 'familyId is required.');
  await assertFamilyMember(String(familyId), request.auth!.uid);
  const requestId = id('privacy_delete');
  await db.collection('privacyRequests').doc(requestId).set({ id: requestId, familyId, requestedByUserId: request.auth!.uid, type: 'delete', status: 'pending_admin_review', createdAt: new Date().toISOString() });
  return { status: 'pending_admin_review', requestId };
});

export const reviewModerationEvent = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const token = request.auth?.token || {};
  if (!token.admin && !token.moderator) throw new HttpsError('permission-denied', 'Moderator role required.');
  const { eventId, decision, reason } = request.data || {};
  if (!eventId || !['approved', 'rejected', 'escalated', 'resolved'].includes(decision)) throw new HttpsError('invalid-argument', 'Valid eventId and decision are required.');
  await db.collection('moderationEvents').doc(String(eventId)).update({ status: decision, resolvedAt: new Date().toISOString(), resolutionReason: reason || '' });
  await db.collection('adminAuditLogs').doc(id('audit')).set({ actorUserId: request.auth!.uid, action: `moderation_${decision}`, targetType: 'moderationEvent', targetId: String(eventId), reason: reason || '', createdAt: new Date().toISOString() });
  return { status: 'ok' };
});
