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
  assert.match(cloud, /aria-live="polite"/);
  assert.match(cloud, /aria-busy=\{state\.status === "loading"\}/);
  assert.match(cloud, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.match(library, /aria-live="polite"/);
  assert.match(library, /aria-busy=\{state\.status === "loading"\}/);
  assert.match(share, /aria-live="polite"/);
  assert.match(share, /aria-busy=\{state\.status === "loading"\}/);
  assert.match(shareControls, /role="status" aria-live="polite"/);
});

test('keyboard focus and sensory fallbacks are explicit in shared Storytime CSS', () => {
  for (const selector of ['a:focus-visible','button:focus-visible','input:focus-visible','textarea:focus-visible','select:focus-visible']) {
    assert.ok(css.includes(selector), `missing focus selector: ${selector}`);
  }
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /scroll-behavior: auto !important/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline-offset: 3px/);
});
