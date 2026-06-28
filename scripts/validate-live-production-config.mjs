#!/usr/bin/env node

const required = {
  URAI_FIREBASE_PROJECT_ID: process.env.URAI_FIREBASE_PROJECT_ID,
  URAI_FIREBASE_STAGING_TARGET: process.env.URAI_FIREBASE_STAGING_TARGET,
  URAI_FIREBASE_PRODUCTION_TARGET: process.env.URAI_FIREBASE_PRODUCTION_TARGET,
  FIREBASE_AUTH_EMAIL_PROVIDER_ENABLED: process.env.FIREBASE_AUTH_EMAIL_PROVIDER_ENABLED,
  STORYTIME_GENERATION_PROVIDER: process.env.STORYTIME_GENERATION_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  STORYTIME_OPENAI_MODEL: process.env.STORYTIME_OPENAI_MODEL,
  NEXT_PUBLIC_STORYTIME_CLOUD_MODE: process.env.NEXT_PUBLIC_STORYTIME_CLOUD_MODE,
  NEXT_PUBLIC_STORYTIME_PROVIDER_READY: process.env.NEXT_PUBLIC_STORYTIME_PROVIDER_READY,
  NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING: process.env.NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING,
  URAI_PRODUCTION_URL: process.env.URAI_PRODUCTION_URL,
  URAI_LEGAL_APPROVED: process.env.URAI_LEGAL_APPROVED,
  URAI_PRIVACY_APPROVED: process.env.URAI_PRIVACY_APPROVED,
  URAI_CHILD_SAFETY_APPROVED: process.env.URAI_CHILD_SAFETY_APPROVED
};

const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
const failures = [];

if (missing.length) failures.push(`Missing required live production values: ${missing.join(', ')}`);
if (process.env.STORYTIME_GENERATION_PROVIDER && process.env.STORYTIME_GENERATION_PROVIDER !== 'openai') failures.push('STORYTIME_GENERATION_PROVIDER must be openai for live production.');
if (process.env.NEXT_PUBLIC_STORYTIME_CLOUD_MODE && process.env.NEXT_PUBLIC_STORYTIME_CLOUD_MODE !== 'true') failures.push('NEXT_PUBLIC_STORYTIME_CLOUD_MODE must be true for live production.');
if (process.env.NEXT_PUBLIC_STORYTIME_PROVIDER_READY && process.env.NEXT_PUBLIC_STORYTIME_PROVIDER_READY !== 'true') failures.push('NEXT_PUBLIC_STORYTIME_PROVIDER_READY must be true for live production.');
if (process.env.NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING && process.env.NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING !== 'true') failures.push('NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING must be true for live production public shares.');
if (process.env.FIREBASE_AUTH_EMAIL_PROVIDER_ENABLED && process.env.FIREBASE_AUTH_EMAIL_PROVIDER_ENABLED !== 'true') failures.push('FIREBASE_AUTH_EMAIL_PROVIDER_ENABLED must be true.');
if (process.env.URAI_LEGAL_APPROVED && process.env.URAI_LEGAL_APPROVED !== 'true') failures.push('URAI_LEGAL_APPROVED must be true.');
if (process.env.URAI_PRIVACY_APPROVED && process.env.URAI_PRIVACY_APPROVED !== 'true') failures.push('URAI_PRIVACY_APPROVED must be true.');
if (process.env.URAI_CHILD_SAFETY_APPROVED && process.env.URAI_CHILD_SAFETY_APPROVED !== 'true') failures.push('URAI_CHILD_SAFETY_APPROVED must be true.');

if (failures.length) {
  console.error('Live production configuration blocked:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Live production configuration gates passed.');
