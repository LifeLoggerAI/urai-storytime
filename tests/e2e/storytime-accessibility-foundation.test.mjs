import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');
const auth = fs.readFileSync('src/components/storytime/AuthPanel.tsx', 'utf8');
const share = fs.readFileSync('src/components/storytime/ShareControls.tsx', 'utf8');
const privacy = fs.readFileSync('src/components/storytime/PrivacyRequestControls.tsx', 'utf8');
const authority = fs.readFileSync('docs/ACCESSIBILITY.md', 'utf8');

test('Storytime provides keyboard skip navigation and programmatic main focus', () => {
  assert.match(home, /storytime-skip-link/);
  assert.match(home, /href="#storytime-main"/);
  assert.match(home, /id="storytime-main"/);
  assert.match(home, /tabIndex=\{-1\}/);
  assert.match(css, /\.storytime-skip-link:focus/);
});

test('Storytime exposes visible focus beyond primary buttons', () => {
  for (const marker of [
    '.storytime-brand:focus-visible',
    '.storytime-card a:focus-visible',
    '.storytime-input:focus-visible',
    'input[type="checkbox"]:focus-visible'
  ]) assert.ok(css.includes(marker), `missing focus marker: ${marker}`);
});

test('Storytime preserves reduced-motion and forced-colors foundations', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation-duration: 0\.001ms !important/);
  assert.match(css, /scroll-behavior: auto !important/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /outline: 3px solid Highlight/);
});

test('async form and account states have semantic announcements', () => {
  assert.match(home, /aria-busy=\{isSubmitting\}/);
  assert.match(home, /role="alert"/);
  assert.match(home, /role="status"/);
  assert.match(auth, /role="alert"/);
  assert.match(auth, /role="status"/);
  assert.match(privacy, /role="status"/);
  assert.match(share, /aria-label="Public sharing controls"/);
});

test('accessibility authority explicitly requires real browser and assistive-technology evidence', () => {
  assert.match(authority, /real browser\/device\/assistive-technology certification is not yet complete/i);
  assert.match(authority, /Keyboard-only/);
  assert.match(authority, /Automated accessibility scan/);
  assert.match(authority, /Screen-reader smoke/);
  assert.match(authority, /200% text zoom/);
  assert.match(authority, /Reduced-motion mode/);
  assert.match(authority, /Forced-colors/);
  assert.match(authority, /does not mean:/i);
});
