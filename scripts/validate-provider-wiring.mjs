import fs from 'node:fs';

const failures = [];
const warnings = [];

function read(file) {
  if (!fs.existsSync(file)) {
    failures.push('Missing file: ' + file);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

const providerSource = read('functions/src/story-provider.ts');
const storytimeSource = read('functions/src/storytime.ts');
const envExample = read('.env.example');

for (const marker of [
  'STORYTIME_GENERATION_PROVIDER',
  'OPENAI_API_KEY',
  'STORYTIME_OPENAI_MODEL',
  'STORYTIME_PROVIDER_SPEND_AUTHORIZED',
  'STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS',
  'STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS',
  'STORYTIME_MAX_GENERATION_COST_USD',
  'STORYTIME_PROVIDER_DAILY_BUDGET_USD',
  'STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD',
  'STORYTIME_OPENAI_MAX_OUTPUT_TOKENS',
  'storytime-provider-receipt-v1',
  'generateStoryWithProvider'
]) {
  if (!providerSource.includes(marker)) failures.push('Provider source missing marker: ' + marker);
}

for (const marker of ['requireConfiguredStoryProvider', 'fallbackProviderOutput', 'providerReceipt']) {
  if (!storytimeSource.includes(marker)) failures.push('Storytime source missing marker: ' + marker);
}

for (const marker of [
  'STORYTIME_GENERATION_PROVIDER',
  'OPENAI_API_KEY',
  'STORYTIME_OPENAI_MODEL',
  'STORYTIME_PROVIDER_SPEND_AUTHORIZED',
  'STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS',
  'STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS',
  'STORYTIME_MAX_GENERATION_COST_USD',
  'STORYTIME_PROVIDER_DAILY_BUDGET_USD',
  'STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD',
  'STORYTIME_OPENAI_MAX_OUTPUT_TOKENS',
  'NEXT_PUBLIC_STORYTIME_PROVIDER_READY'
]) {
  if (!envExample.includes(marker)) failures.push('Env example missing marker: ' + marker);
}

if (process.env.STORYTIME_GENERATION_PROVIDER === 'openai') {
  for (const key of [
    'OPENAI_API_KEY',
    'STORYTIME_OPENAI_MODEL',
    'STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS',
    'STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS',
    'STORYTIME_MAX_GENERATION_COST_USD',
    'STORYTIME_PROVIDER_DAILY_BUDGET_USD',
    'STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD'
  ]) {
    if (!process.env[key]) failures.push('Live provider mode missing required environment value: ' + key);
  }
  if (process.env.STORYTIME_PROVIDER_SPEND_AUTHORIZED !== 'true') {
    failures.push('Live provider mode requires STORYTIME_PROVIDER_SPEND_AUTHORIZED=true.');
  }
} else {
  warnings.push('Live provider mode is not enabled in this environment; provider remains source-verified only.');
}

if (failures.length > 0) {
  console.error('Storytime provider wiring validation failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Storytime provider wiring source validation passed.');
if (warnings.length > 0) {
  console.warn('Provider wiring warnings:');
  for (const warning of warnings) console.warn('- ' + warning);
}
