import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');
const auth = fs.readFileSync('src/components/storytime/AuthPanel.tsx', 'utf8');
const cloud = fs.readFileSync('src/components/storytime/CloudSession.tsx', 'utf8');
const share = fs.readFileSync('src/components/storytime/ShareControls.tsx', 'utf8');
const settings = fs.readFileSync('src/components/storytime/StorySettings.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

test('creation and account forms expose native requirements, busy state, and live validation', () => {
  assert.match(home, /aria-busy=\{isSubmitting\}/);
  assert.match(home, /required aria-invalid=/);
  assert.match(home, /id="storytime-validation" role="status" aria-live="polite"/);
  assert.match(home, /id="storytime-source-count"/);
  assert.doesNotMatch(home, /error instanceof Error \? error\.message/);
  assert.match(auth, /type="email"[\s\S]*required aria-invalid=/);
  assert.match(auth, /type="password"[\s\S]*required minLength=\{8\} aria-invalid=/);
});

test('cloud loading and errors are announced without requiring visual discovery', () => {
  assert.match(cloud, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.match(cloud, /aria-live=\{state\.status === "error" \? "assertive" : "polite"\}/);
  assert.match(cloud, /aria-busy=\{state\.status === "loading" \? true : undefined\}/);
  assert.doesNotMatch(cloud, /error instanceof Error \? error\.message/);
});

test('sharing never exposes raw callable errors and announces action results', () => {
  assert.match(share, /We couldn’t complete that sharing request\. No private story data was exposed\./);
  assert.doesNotMatch(share, /error instanceof Error \? error\.message/);
  assert.match(share, /role=\{messageIsError \? "alert" : "status"\}/);
  assert.match(share, /aria-live=\{messageIsError \? "assertive" : "polite"\}/);
});

test('keyboard focus, reduced motion, and forced colors have explicit source contracts', () => {
  assert.match(css, /\.storytime-card a:focus-visible/);
  assert.match(css, /input\[type="checkbox"\]:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /scroll-behavior: auto !important/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline: 3px solid Highlight/);
});

test('settings do not describe a nonexistent voiceover queue', () => {
  assert.match(settings, /Voiceover \/ media/);
  assert.match(settings, /Hard-off/);
  assert.match(settings, /governed worker/);
  assert.doesNotMatch(settings, /Queued voiceover generation/);
});
