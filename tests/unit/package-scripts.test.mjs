import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredScripts = [
  'lint',
  'typecheck',
  'test',
  'test:smoke',
  'test:env-template',
  'test:security-rules',
  'test:emulator-scaffold',
  'test:emulator-runtime',
  'test:provider-wiring',
  'test:production-evidence',
  'test:production-smoke',
  'test:production-readiness',
  'validate:release-promotion',
  'deploy:rules',
  'deploy:functions',
  'deploy:hosting'
];

test('package exposes required Storytime verification scripts', () => {
  for (const scriptName of requiredScripts) {
    assert.equal(typeof packageJson.scripts[scriptName], 'string', `${scriptName} must be defined`);
  }
});

test('release promotion stays evidence-gated', () => {
  assert.match(packageJson.scripts['validate:release-promotion'], /test:provider-wiring/);
  assert.match(packageJson.scripts['validate:release-promotion'], /test:production-evidence/);
  assert.match(packageJson.scripts['validate:release-promotion'], /test:production-smoke/);
});

test('deployment scripts remain explicit by target', () => {
  assert.match(packageJson.scripts['deploy:rules'], /firestore:rules,firestore:indexes/);
  assert.match(packageJson.scripts['deploy:functions'], /functions/);
  assert.match(packageJson.scripts['deploy:hosting'], /hosting/);
});
