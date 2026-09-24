import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');
const library = fs.readFileSync('src/components/storytime/SessionLibrary.tsx', 'utf8');
const sharing = fs.readFileSync('src/components/storytime/ShareControls.tsx', 'utf8');
const cloud = fs.readFileSync('src/components/storytime/CloudSession.tsx', 'utf8');

test('active Next Storytime has a keyboard skip link and focus target', () => {
  assert.match(layout, /storytime-skip-link/);
  assert.match(layout, /href="#storytime-main-content"/);
  assert.match(layout, /id="storytime-main-content"/);
  assert.match(layout, /tabIndex=\{-1\}/);
  assert.match(css, /\.storytime-skip-link:focus/);
});

test('Storytime source preserves text scaling, visible keyboard focus, touch targets, and motion alternatives', () => {
  assert.match(css, /text-size-adjust: 100%/);
  assert.match(css, /:where\(a, button, input, textarea, select\):focus-visible/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /input\[type="checkbox"\]/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
});

test('async Storytime state changes are announced without turning normal status into alerts', () => {
  assert.match(library, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.match(library, /aria-live=\{state\.status === "error" \? "assertive" : "polite"\}/);
  assert.match(cloud, /role=\{state\.status === "error" \? "alert" : "status"\}/);
  assert.match(sharing, /role="status" aria-live="polite"/);
});
