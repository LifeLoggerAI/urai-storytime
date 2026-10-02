import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const locales = fs.readFileSync('src/lib/storytime/locales.ts', 'utf8');
const home = fs.readFileSync('src/components/storytime/StorytimeHome.tsx', 'utf8');
const fn = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const provider = fs.readFileSync('functions/src/story-provider.ts', 'utf8');

test('Storytime records all 20 governed launch languages without claiming unsupported runtime localization', () => {
  const localeMarkers = ['en-US','zh-CN','hi-IN','es','fr','ar','bn','pt-BR','ru','ur','id','de','ja','sw','tr','vi','fil','ko','it','fa'];
  for (const locale of localeMarkers) assert.ok(locales.includes(`locale: "${locale}"`), `missing locale ${locale}`);
  assert.match(locales, /hard_off_pending_native_safety_review/);
  assert.match(locales, /direction: "rtl"/);
  assert.match(locales, /STORYTIME_ENABLED_LOCALES/);
});

test('current generation remains explicitly English-only until review unlocks additional locales', () => {
  assert.match(home, /locale: "en-US"/);
  assert.match(fn, /locale: z\.literal\("en-US"\)/);
  assert.match(provider, /locale: "en-US"/);
  assert.match(provider, /Do not silently translate or switch languages/);
});
