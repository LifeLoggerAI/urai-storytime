import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const home = read('src/components/storytime/StorytimeHome.tsx');
const sessionPage = read('src/app/storytime/[sessionId]/page.tsx');
const cloudSession = read('src/components/storytime/CloudSession.tsx');
const shareStory = read('src/components/storytime/ShareStory.tsx');
const shareControls = read('src/components/storytime/ShareControls.tsx');
const functions = read('functions/src/storytime.ts');
const shareLifecycle = read('functions/src/public-story-share-lifecycle.ts');
const functionsIndex = read('functions/src/index.ts');
const provider = read('functions/src/story-provider.ts');
const rules = read('firestore.rules');
const storageRules = read('storage.rules');
const runtimeReadiness = read('src/runtime-readiness.mjs');
const proofReadme = read('launch-proof/urai-storytime-production-lock/2026-06-30T0100Z/README.md');

function includesAll(source, markers) {
  for (const marker of markers) assert.ok(source.includes(marker), `Missing marker: ${marker}`);
}

test('cloud Storytime creation stays gated behind auth, cloud mode, consent, provider readiness, and safety checks', () => {
  includesAll(home, [
    'isStorytimeCloudModeEnabled',
    'Cloud generation unavailable',
    'Create Story requires a signed-in Firebase user',
    'consentSnapshot',
    'storyGeneration: true',
    'voiceover: false',
    'publicSharing: false',
    'memoryUse: false'
  ]);

  includesAll(functions, [
    'requireAuth(request.auth?.uid)',
    'GenerateStorySchema.parse',
    'Story generation consent is required',
    'Story input requires safety review before generation',
    'enforceGenerationQuota(userId)',
    'requireConfiguredStoryProvider(userId)',
    'generateStoryWithProvider'
  ]);
});

test('OpenAI provider cannot be claimed live without provider, key, and model gates', () => {
  includesAll(provider, [
    'STORYTIME_GENERATION_PROVIDER',
    'OPENAI_API_KEY',
    'STORYTIME_OPENAI_MODEL',
    'provider === "openai"',
    'response_format',
    'json_object'
  ]);
  assert.match(provider, /Story provider is not configured/);
  assert.match(proofReadme, /PARTIAL \/ BLOCKED FROM READY/);
});

test('generation persistence bundle writes all expected private Storytime records', () => {
  for (const collection of [
    'storySessions',
    'storyChapters',
    'storyMoments',
    'memoryScenes',
    'narratorScripts',
    'emotionalArcSummaries'
  ]) {
    assert.match(functions, new RegExp(`collection\\("${collection}"\\)`));
  }

  includesAll(cloudSession, [
    'storySessions',
    'storyChapters',
    'memoryScenes',
    'narratorScripts',
    'emotionalArcSummaries',
    'Sign in is required to view saved cloud sessions'
  ]);
});

test('public sharing uses content-neutral expiring derivatives and private owner controls', () => {
  includesAll(functionsIndex, [
    'createPublicStoryShare',
    'revokePublicStoryShare',
    'public-story-share-lifecycle.js'
  ]);

  includesAll(shareLifecycle, [
    'expiresInDays',
    'Timestamp.fromMillis',
    'Public sharing consent is required',
    'Only safety-approved stories can be shared',
    'publicStoryShares',
    'publicStoryShareControls',
    'schemaVersion: "public-story-share-v2"',
    'title: "Shared Story"',
    'safeSummary',
    'safeBody',
    'public_safe',
    'FieldValue.delete()',
    'visibility: "private"'
  ]);
  assert.doesNotMatch(shareLifecycle, /session\.(title|whyGenerated|sourceText|sourceSignals|symbolicMotifs)/);

  includesAll(shareStory, [
    'getDoc(doc(db, "publicStoryShares", shareId))',
    'data.slug !== id || data.revoked !== false',
    'Date.parse(expiresAt) <= Date.now()',
    'No active public-safe Storytime share was found.',
    'This public page shows only redacted share text'
  ]);
  assert.doesNotMatch(shareStory, /collection\(|getDocs\(|where\(/);

  includesAll(shareControls, [
    'createPublicStoryShare',
    'revokePublicStoryShare',
    'Explicit public-sharing consent is required'
  ]);
});

test('voiceover and export remain queued job records, not completed artifact claims', () => {
  includesAll(functions, [
    'prepareVoiceoverJob',
    'Voiceover consent is required',
    'voiceoverJobs',
    'storyExports',
    'status: "queued"',
    'Voiceover export queued'
  ]);

  assert.doesNotMatch(functions, /downloadURL|signedUrl|completedUrl|artifactUrl/);
  assert.match(proofReadme, /export artifact pipeline proof was available/);
});

test('rules keep Storytime private by default and enforce server-time public-share expiry', () => {
  includesAll(rules, [
    'function ownerOnlyCreate()',
    'function ownerOnlyReadWrite(userId)',
    'match /storySessions/{id}',
    'function activePublicShare()',
    "resource.data.schemaVersion == 'public-story-share-v2'",
    "!resource.data.keys().hasAny(['userId', 'sessionId'])",
    'request.time < resource.data.expiresAt',
    'match /publicStoryShares/{id}',
    'allow read: if activePublicShare()',
    'match /publicStoryShareControls/{id}',
    'match /storytimeUsageCounters/{id}',
    'allow read, write: if false'
  ]);

  assert.match(storageRules, /allow read, write: if false/);
});

test('demo routes and runtime readiness preserve non-production launch boundary', () => {
  includesAll(sessionPage, [
    'sessionId === "demo"',
    'Deterministic demo session',
    'does not prove provider generation'
  ]);
  includesAll(runtimeReadiness, [
    'status: RUNTIME_STATUS.red',
    'Production deployment',
    'Production deploy target, smoke evidence, rollback evidence, and secrets are not verified'
  ]);
});
