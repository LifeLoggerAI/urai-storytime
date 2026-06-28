import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const envTemplate = fs.readFileSync('.env.example', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const validator = fs.readFileSync('scripts/validate-env-template.mjs', 'utf8');

const requiredVariables = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_STORYTIME_CLOUD_MODE',
  'NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING',
  'NEXT_PUBLIC_STORYTIME_PROVIDER_READY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'STORYTIME_CLOUD_MODE',
  'STORYTIME_PUBLIC_SHARING',
  'STORYTIME_GENERATION_PROVIDER',
  'STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER',
  'ASSET_FACTORY_BASE_URL',
  'ASSET_FACTORY_API_KEY',
  'OPENAI_API_KEY',
  'STORYTIME_OPENAI_MODEL'
];

test('.env.example includes every required Storytime variable', () => {
  for (const variableName of requiredVariables) {
    assert.match(envTemplate, new RegExp(`^${variableName}=`, 'm'));
  }
});

test('environment-sensitive feature flags default off in the template', () => {
  assert.match(envTemplate, /^NEXT_PUBLIC_STORYTIME_CLOUD_MODE=false$/m);
  assert.match(envTemplate, /^NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING=false$/m);
  assert.match(envTemplate, /^NEXT_PUBLIC_STORYTIME_PROVIDER_READY=false$/m);
  assert.match(envTemplate, /^STORYTIME_CLOUD_MODE=false$/m);
  assert.match(envTemplate, /^STORYTIME_PUBLIC_SHARING=false$/m);
  assert.match(envTemplate, /^STORYTIME_GENERATION_PROVIDER=disabled$/m);
  assert.match(envTemplate, /^STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER=false$/m);
});

test('env template validator is wired into package scripts', () => {
  assert.equal(packageJson.scripts['test:env-template'], 'node scripts/validate-env-template.mjs');
  assert.match(validator, /requiredVariables/);
  assert.match(validator, /STORYTIME_OPENAI_MODEL/);
  assert.match(validator, /NEXT_PUBLIC_STORYTIME_PROVIDER_READY=false/);
  assert.match(validator, /STORYTIME_GENERATION_PROVIDER=disabled/);
});
