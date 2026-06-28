#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.example');
const failures = [];

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

if (!fs.existsSync(envPath)) {
  failures.push('Missing .env.example');
} else {
  const envTemplate = fs.readFileSync(envPath, 'utf8');
  for (const variableName of requiredVariables) {
    if (!envTemplate.includes(`${variableName}=`)) {
      failures.push(`Missing environment template variable: ${variableName}`);
    }
  }

  for (const gatedFlag of [
    'NEXT_PUBLIC_STORYTIME_CLOUD_MODE=false',
    'NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING=false',
    'NEXT_PUBLIC_STORYTIME_PROVIDER_READY=false',
    'STORYTIME_CLOUD_MODE=false',
    'STORYTIME_PUBLIC_SHARING=false',
    'STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER=false'
  ]) {
    if (!envTemplate.includes(gatedFlag)) failures.push(`${gatedFlag} must be present in .env.example.`);
  }

  if (!envTemplate.includes('STORYTIME_GENERATION_PROVIDER=disabled')) {
    failures.push('STORYTIME_GENERATION_PROVIDER must default to disabled in .env.example.');
  }
}

if (failures.length > 0) {
  console.error('\nEnvironment template validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Environment template validation passed.');
console.log('Secrets must be configured outside source control before staging or production deploys.');
