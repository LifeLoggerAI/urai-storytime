import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');
const library = fs.readFileSync('src/components/storytime/SessionLibrary.tsx', 'utf8');
const share = fs.readFileSync('src/components/storytime/ShareStory.tsx', 'utf8');
const authority = fs.readFileSync('docs/ACCESSIBILITY.md', 'utf8');

test('global Storytime skip navigation and text scaling foundations are present', () => {
  assert.match(layout, /storytime-skip-link/);
  assert.match(layout, /href="#storytime-main-content"/);
  assert.match(layout, /id="storytime-main-content"/);
  assert.match(layout, /tabIndex=\{-1\}/);
  assert.match(css, /-webkit-text-size-adjust: 100%/);
  assert.match(css, /text-size-adjust: 100%/);
  assert.match(css, /\.storytime-skip-link/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /inline-size: 22px/);
});

test('saved-session and public-share async states expose live busy/error semantics', () => {
  assert.match(library, /aria-live="polite"/);
  assert.match(library, /aria-busy=\{state\.status === "loading"\}/);
  assert.match(library, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.match(share, /aria-live="polite"/);
  assert.match(share, /aria-busy=\{state\.status === "loading"\}/);
  assert.match(share, /role=\{state\.status === "error" \? "alert" : "status"\}/);
});

test('accessibility authority preserves runtime-certification boundary', () => {
  assert.match(authority, /real browser\/device\/assistive-technology certification is not yet complete/i);
  assert.match(authority, /Keyboard-only/);
  assert.match(authority, /Screen-reader smoke/);
  assert.match(authority, /200% text zoom/);
  assert.match(authority, /Forced-colors/);
  assert.match(authority, /does not mean:/i);
});
