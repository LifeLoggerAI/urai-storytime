import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const home = read('src/components/storytime/StorytimeHome.tsx');
const cloud = read('src/components/storytime/CloudSession.tsx');
const library = read('src/components/storytime/SessionLibrary.tsx');
const share = read('src/components/storytime/ShareStory.tsx');
const shareControls = read('src/components/storytime/ShareControls.tsx');
const css = read('src/app/globals.css');

test('dynamic Storytime states expose live-region and busy semantics', () => {
  assert.match(home, /aria-busy=\{isSubmitting\}/);
  assert.match(home, /role="status" aria-live="polite"/);
  assert.match(cloud, /aria-live=\{state\.status === "error" \? "assertive" : "polite"\}|aria-live="polite"/);
  assert.match(cloud, /aria-busy=\{state\.status === "loading"(?: \? true : undefined)?\}/);
  assert.match(cloud, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.match(library, /aria-live=\{state\.status === "error" \? "assertive" : "polite"\}|aria-live="polite"/);
  assert.match(library, /aria-busy=\{state\.status === "loading"(?: \? true : undefined)?\}/);
  assert.match(share, /aria-live=\{state\.status === "error" \? "assertive" : "polite"\}|aria-live="polite"/);
  assert.match(share, /aria-busy=\{state\.status === "loading"(?: \? true : undefined)?\}/);
  assert.match(shareControls, /role=\{messageIsError \? "alert" : "status"\}|role="status"/);
  assert.match(shareControls, /aria-live=\{messageIsError \? "assertive" : "polite"\}|aria-live="polite"/);
});

test('keyboard focus and sensory fallbacks are explicit in shared Storytime CSS', () => {
  assert.match(css, /:where\(a, button, input, textarea, select\):focus-visible|a:focus-visible/);
  assert.match(css, /\.storytime-input:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /scroll-behavior: auto !important/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline-offset: 3px/);
});
