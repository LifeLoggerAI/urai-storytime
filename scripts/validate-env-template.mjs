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
  'GOOGLE_APPLICATION_CREDENTIALS',
  'URAI_STORYTIME_FIREBASE_ADMIN_METADATA_READY',
  'URAI_STORYTIME_FIREBASE_PROJECT_ID',
  'URAI_STORYTIME_STAGING_TARGET',
  'URAI_STORYTIME_PRODUCTION_TARGET',
  'URAI_CORE_FIREBASE_PROJECT_ID',
  'URAI_ANALYTICS_FIREBASE_PROJECT_ID',
  'STORYTIME_FIREBASE_ISOLATED',
  'STORYTIME_CLOUD_MODE',
  'STORYTIME_PUBLIC_SHARING',
  'STORYTIME_GENERATION_PROVIDER',
  'STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER',
  'STORYTIME_PUBLIC_SHARE_TTL_DAYS',
  'ASSET_FACTORY_BASE_URL',
  'ASSET_FACTORY_API_KEY',
  'OPENAI_API_KEY',
  'STORYTIME_OPENAI_MODEL'
];

const forbiddenPrivateKeyVariables = [
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'GOOGLE_CREDENTIALS'
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

  for (const variableName of forbiddenPrivateKeyVariables) {
    if (new RegExp(`^${variableName}=`, 'm').test(envTemplate)) {
      failures.push(`Long-lived Firebase Admin credential variable is forbidden: ${variableName}`);
    }
  }

  for (const gatedFlag of [
    'NEXT_PUBLIC_STORYTIME_CLOUD_MODE=false',
    'NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING=false',
    'NEXT_PUBLIC_STORYTIME_PROVIDER_READY=false',
    'STORYTIME_CLOUD_MODE=false',
    'STORYTIME_PUBLIC_SHARING=false',
    'STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER=false',
    'STORYTIME_PUBLIC_SHARE_TTL_DAYS=30',
    'STORYTIME_FIREBASE_ISOLATED=false',
    'URAI_STORYTIME_FIREBASE_ADMIN_METADATA_READY=0'
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
console.log('Firebase Admin accepts only external_account WIF or explicitly certified Google metadata identity; production remains NO-GO until provider proof.');
