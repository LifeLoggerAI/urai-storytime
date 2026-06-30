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

for (const marker of ['STORYTIME_GENERATION_PROVIDER', 'OPENAI_API_KEY', 'STORYTIME_OPENAI_MODEL', 'generateStoryWithProvider']) {
  if (!providerSource.includes(marker)) failures.push('Provider source missing marker: ' + marker);
}

for (const marker of ['requireConfiguredStoryProvider', 'fallbackProviderOutput']) {
  if (!storytimeSource.includes(marker)) failures.push('Storytime source missing marker: ' + marker);
}

for (const marker of ['STORYTIME_GENERATION_PROVIDER', 'OPENAI_API_KEY', 'STORYTIME_OPENAI_MODEL', 'NEXT_PUBLIC_STORYTIME_PROVIDER_READY']) {
  if (!envExample.includes(marker)) failures.push('Env example missing marker: ' + marker);
}

if (process.env.STORYTIME_GENERATION_PROVIDER === 'openai') {
  for (const key of ['OPENAI_API_KEY', 'STORYTIME_OPENAI_MODEL']) {
    if (!process.env[key]) failures.push('Live provider mode missing required environment value: ' + key);
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
