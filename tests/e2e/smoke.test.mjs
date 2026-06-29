import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const packageJson = JSON.parse(read('package.json'));
const storytimeHome = read('src/components/storytime/StorytimeHome.tsx');
const authPanel = read('src/components/storytime/AuthPanel.tsx');
const storytimeSessionRoute = read('src/app/storytime/[sessionId]/page.tsx');
const cloudSession = read('src/components/storytime/CloudSession.tsx');
const sessionLibrary = read('src/components/storytime/SessionLibrary.tsx');
const shareControls = read('src/components/storytime/ShareControls.tsx');
const shareStory = read('src/components/storytime/ShareStory.tsx');
const runtimeConfig = read('src/lib/storytime/runtime-config.ts');
const storyBuilder = read('src/lib/storytime/story-builder.ts');
const storySettings = read('src/components/storytime/StorySettings.tsx');
const globals = read('src/app/globals.css');
const shareRoute = read('src/app/share/story/[shareId]/page.tsx');
const rules = read('firestore.rules');
const indexes = read('firestore.indexes.json');
const firebaseConfig = read('firebase.json');
const functions = read('functions/src/storytime.ts');
const auditLog = read('functions/src/audit-log.ts');
const functionsIndex = read('functions/src/index.ts');
const revokeShareFunction = read('functions/src/revoke-public-story-share.ts');
const storyProvider = read('functions/src/story-provider.ts');
const deploymentDoc = read('docs/STORYTIME_DEPLOYMENT.md');
const qaDoc = read('docs/STORYTIME_QA_CHECKLIST.md');

test('Next and Firebase scripts are present', () => {
  assert.equal(packageJson.scripts.build, 'next build');
  assert.equal(packageJson.scripts.typecheck, 'tsc --noEmit');
  assert.match(packageJson.scripts['deploy:rules'], /firestore:rules/);
  assert.match(packageJson.dependencies.next, /^\^15/);
  assert.match(packageJson.dependencies.firebase, /^\^11/);
});

test('Storytime app routes are wired', () => {
  assert.match(storytimeHome, /URAI Narrative Engine/);
  assert.match(storytimeHome, /Private by default/);
  assert.match(storytimeSessionRoute, /CloudSession/);
  assert.match(storytimeSessionRoute, /Demo mode/);
  assert.match(shareRoute, /ShareStory/);
  assert.match(shareRoute, /Public-safe share demo/);
});

test('Storytime create form has cloud and demo paths', () => {
  assert.match(storytimeHome, /onSubmit=\{handleCreateStory\}/);
  assert.match(storytimeHome, /httpsCallable/);
  assert.match(storytimeHome, /generateStorySession/);
  assert.match(storytimeHome, /Cloud generation unavailable/);
  assert.match(storytimeHome, /Open Demo Story Session/);
  assert.match(storytimeHome, /Create Story/);
  assert.match(storytimeHome, /MAX_DEMO_SOURCE_CHARS/);
});

test('Storytime account panel supports Firebase email authentication', () => {
  assert.match(storytimeHome, /AuthPanel/);
  assert.match(authPanel, /createUserWithEmailAndPassword/);
  assert.match(authPanel, /signInWithEmailAndPassword/);
  assert.match(authPanel, /signOut/);
  assert.match(authPanel, /Firebase client config is required/);
});

test('Storytime session route preserves demo while allowing real ids', () => {
  assert.doesNotMatch(storytimeSessionRoute, /dynamicParams = false/);
  assert.match(storytimeSessionRoute, /sessionId === "demo"/);
  assert.match(storytimeSessionRoute, /<CloudSession sessionId=\{sessionId\}/);
  assert.match(cloudSession, /storySessions/);
  assert.match(cloudSession, /storyChapters/);
  assert.match(cloudSession, /memoryScenes/);
  assert.match(cloudSession, /narratorScripts/);
  assert.match(cloudSession, /Sign in is required/);
  assert.match(cloudSession, /No saved cloud session/);
});

test('Storytime builder normalizes bounded user input', () => {
  for (const marker of [
    'MAX_TITLE_CHARS',
    'MAX_SOURCE_CHARS',
    'MAX_TONE_CHARS',
    'MAX_MOTIFS',
    'MAX_SOURCE_SIGNALS',
    'normalizeText',
    'normalizeList'
  ]) {
    assert.match(storyBuilder, new RegExp(marker));
  }
  assert.match(storyBuilder, /title = normalizeText\(input\.title/);
  assert.match(storyBuilder, /source = normalizeText\(input\.sourceText/);
  assert.match(storyBuilder, /symbolicMotifs = normalizeList\(input\.symbolicMotifs/);
});

test('Storytime settings preserve consent and launch boundaries', () => {
  assert.match(storySettings, /private by default/i);
  assert.match(storySettings, /read-only in the demo build/i);
  assert.match(storySettings, /Firebase auth, Firestore persistence, security rules/);
  assert.match(storySettings, /Public-safe shares require consent, redaction, and safety review/);
  assert.match(globals, /\.storytime-button:disabled/);
});

test('Public share route has real fetch states and demo safety boundaries', () => {
  assert.match(shareRoute, /MAX_SHARE_ID_CHARS/);
  assert.match(shareRoute, /normalizeShareId/);
  assert.match(shareRoute, /safeShareId === "demo"/);
  assert.match(shareStory, /publicStoryShares/);
  assert.match(shareStory, /revoked/);
  assert.match(shareStory, /expired/);
  assert.match(shareStory, /Public sharing is gated/);
});

test('Public share owner controls create and revoke through callables', () => {
  assert.match(cloudSession, /ShareControls/);
  assert.match(shareControls, /createPublicStoryShare/);
  assert.match(shareControls, /revokePublicStoryShare/);
  assert.match(shareControls, /Explicit public-sharing consent is required/);
  assert.match(functionsIndex, /revokePublicStoryShare/);
  assert.match(revokeShareFunction, /Public share not found/);
  assert.match(revokeShareFunction, /revoked: true/);
  assert.match(revokeShareFunction, /visibility: "private"/);
});

test('Runtime config gates cloud, provider, and public sharing', () => {
  assert.match(runtimeConfig, /NEXT_PUBLIC_STORYTIME_CLOUD_MODE/);
  assert.match(runtimeConfig, /NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING/);
  assert.match(runtimeConfig, /NEXT_PUBLIC_STORYTIME_PROVIDER_READY/);
  assert.match(runtimeConfig, /providerConfigured/);
  assert.match(sessionLibrary, /NEXT_PUBLIC_STORYTIME_CLOUD_MODE=true/);
});

test('Firestore rules enforce owner and public-share boundaries', () => {
  assert.match(rules, /function isOwner/);
  assert.match(rules, /match \/storySessions\/{id}/);
  assert.match(rules, /match \/publicStoryShares\/{id}/);
  assert.match(rules, /revoked == false/);
  assert.match(rules, /allow update, delete: if false/);
});

test('Firestore indexes include core Storytime queries', () => {
  const parsed = JSON.parse(indexes);
  const collectionGroups = parsed.indexes.map((index) => index.collectionGroup);
  assert.ok(collectionGroups.includes('storySessions'));
  assert.ok(collectionGroups.includes('storyChapters'));
  assert.ok(collectionGroups.includes('storyMoments'));
  assert.ok(collectionGroups.includes('publicStoryShares'));
});

test('Firebase hosting and functions config are present', () => {
  assert.match(firebaseConfig, /frameworksBackend/);
  assert.match(firebaseConfig, /storytime/);
  assert.match(firebaseConfig, /firestore\.rules/);
});

test('Callable functions cover Storytime lifecycle hooks, provider wiring, and quota gate', () => {
  for (const name of [
    'generateStorySession',
    'createPublicStoryShare',
    'generateNarratorScript',
    'generateEmotionalArcSummary',
    'generateWeeklyStoryScroll',
    'prepareVoiceoverJob',
    'refreshStoryTimeline',
    'rebuildUserStoryArchive'
  ]) {
    assert.match(functions, new RegExp(`export const ${name}`));
  }
  assert.match(functions, /Story generation consent is required/);
  assert.match(functions, /requireConfiguredStoryProvider/);
  assert.match(functions, /generateStoryWithProvider/);
  assert.match(functions, /MAX_GENERATIONS_PER_HOUR/);
  assert.match(functions, /MAX_GENERATIONS_PER_DAY/);
  assert.match(functions, /enforceGenerationQuota/);
  assert.match(functions, /storytimeUsageCounters/);
  assert.match(functions, /resource-exhausted/);
  assert.match(storyProvider, /response_format/);
  assert.match(storyProvider, /Do not diagnose/);
  assert.match(functions, /Public sharing requires explicit consent/);
});

test('Storytime Functions emit privacy-safe audit log events', () => {
  assert.match(auditLog, /StorytimeAuditEvent/);
  assert.match(auditLog, /generation_requested/);
  assert.match(auditLog, /generation_blocked_safety/);
  assert.match(auditLog, /generation_blocked_quota/);
  assert.match(auditLog, /provider_failed/);
  assert.match(auditLog, /story_persisted/);
  assert.match(auditLog, /public_share_created/);
  assert.match(auditLog, /voiceover_export_queued/);
  assert.match(functions, /auditLog\(\{ event: "generation_requested"/);
  assert.match(functions, /auditLog\(\{ event: "story_persisted"/);
  assert.match(functions, /auditLog\(\{ event: "public_share_created"/);
  assert.match(functions, /auditLog\(\{ event: "voiceover_export_queued"/);
  assert.doesNotMatch(auditLog, /sourceText|generated story body|raw provider/i);
});

test('Deployment and QA docs preserve launch boundaries', () => {
  assert.match(deploymentDoc, /Known launch boundary/);
  assert.match(deploymentDoc, /firebase deploy --only firestore:rules,firestore:indexes/);
  assert.match(qaDoc, /Story sessions default to `visibility: private`/);
  assert.match(qaDoc, /avoids diagnosis|no diagnosis/i);
});
