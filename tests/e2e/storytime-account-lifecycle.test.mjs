import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const authPanel = fs.readFileSync('src/components/storytime/AuthPanel.tsx', 'utf8');
const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');
const storyFunctions = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const shareLifecycle = fs.readFileSync('functions/src/public-story-share-lifecycle.ts', 'utf8');

test('account source includes email verification and password recovery without raw auth errors', () => {
  assert.match(authPanel, /sendEmailVerification/);
  assert.match(authPanel, /sendPasswordResetEmail/);
  assert.match(authPanel, /emailVerified/);
  assert.match(authPanel, /Resend verification/);
  assert.match(authPanel, /Reset password/);
  assert.match(authPanel, /If that address can receive a reset email/);
  assert.doesNotMatch(authPanel, /error\.message|String\(error\)/);
});

test('cloud story generation is blocked for unverified email accounts on client and server', () => {
  assert.match(home, /auth\.currentUser\.emailVerified/);
  assert.match(home, /Verify the adult\/guardian account email before creating a cloud story/);
  assert.match(storyFunctions, /requireVerifiedAdultAccount\(request\.auth\?\.token\.email_verified\)/);
  assert.match(storyFunctions, /Verify the adult\/guardian account email before creating cloud stories/);
});

test('share creation requires verification while share revocation remains independently available', () => {
  const createIndex = shareLifecycle.indexOf('export const createPublicStoryShare');
  const revokeIndex = shareLifecycle.indexOf('export const revokePublicStoryShare');
  assert.ok(createIndex >= 0 && revokeIndex > createIndex);
  const createSection = shareLifecycle.slice(createIndex, revokeIndex);
  const revokeSection = shareLifecycle.slice(revokeIndex);
  assert.match(createSection, /requireVerifiedAccount\(request\)/);
  assert.doesNotMatch(revokeSection, /requireVerifiedAccount\(request\)/);
});
