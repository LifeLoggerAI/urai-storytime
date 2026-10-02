import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

function tuple(version) {
  return version.replace(/^[^0-9]*/, '').split('.').slice(0, 3).map(Number);
}

function atLeast(version, minimum) {
  const a = tuple(version);
  const b = tuple(minimum);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return true;
    if ((a[index] || 0) < (b[index] || 0)) return false;
  }
  return true;
}

test('Storytime stays on the patched Next 15 maintenance security baseline', () => {
  assert.ok(atLeast(pkg.dependencies.next, '15.5.26'), `package.json Next.js range is below 15.5.26: ${pkg.dependencies.next}`);
  const resolved = lock.packages?.['node_modules/next']?.version;
  assert.equal(typeof resolved, 'string');
  assert.ok(atLeast(resolved, '15.5.26'), `package-lock Next.js is below 15.5.26: ${resolved}`);
});

test('Next native compiler records stay aligned to the locked framework patch', () => {
  const resolved = lock.packages?.['node_modules/next']?.version;
  assert.equal(lock.packages?.['node_modules/@next/env']?.version, resolved);
  const swcKeys = Object.keys(lock.packages || {}).filter((key) => key.startsWith('node_modules/@next/swc-'));
  assert.ok(swcKeys.length >= 8);
  for (const key of swcKeys) assert.equal(lock.packages[key].version, resolved, `${key} drifted from Next.js ${resolved}`);
});
