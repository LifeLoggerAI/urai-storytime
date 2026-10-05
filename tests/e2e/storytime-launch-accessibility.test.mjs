import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');
const library = fs.readFileSync('src/components/storytime/SessionLibrary.tsx', 'utf8');
const cloud = fs.readFileSync('src/components/storytime/CloudSession.tsx', 'utf8');
const sharing = fs.readFileSync('src/components/storytime/ShareControls.tsx', 'utf8');
const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');

test('Storytime exposes a keyboard skip target without changing route ownership', () => {
  assert.match(layout, /className="storytime-skip-link"/);
  assert.match(layout, /href="#storytime-main-content"/);
  assert.match(layout, /id="storytime-main-content"/);
  assert.match(layout, /tabIndex=\{-1\}/);
  assert.match(css, /\.storytime-skip-link:focus/);
});

test('Storytime preserves browser text scaling, visible focus, touch targets, and motion alternatives', () => {
  assert.match(css, /text-size-adjust: 100%/);
  assert.match(css, /:where\(a, button, input, textarea, select\):focus-visible/);
  assert.match(css, /min-height: 48px/);
  assert.match(css, /input\[type="checkbox"\]/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
});

test('current async Storytime surfaces announce normal status and errors without weakening fail-closed behavior', () => {
  for (const source of [library, cloud]) {
    assert.match(source, /role=\{state\.status === "error" \? "alert" : "status"\}/);
    assert.match(source, /aria-live=\{state\.status === "error" \? "assertive" : "polite"\}/);
  }
  assert.match(library, /aria-busy=\{state\.status === "loading" \? true : undefined\}/);
  assert.match(cloud, /aria-busy=\{state\.status === "loading" \? true : undefined\}/);
  assert.match(sharing, /role=\{messageIsError \? "alert" : "status"\}/);
  assert.match(home, /aria-busy=\{isSubmitting\}/);
  assert.match(home, /role="alert"/);
  assert.match(home, /aria-live="polite"/);
});
