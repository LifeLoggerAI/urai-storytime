import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const provider = fs.readFileSync('functions/src/story-provider.ts', 'utf8');
const storytime = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');
const readiness = fs.readFileSync('functions/src/readiness.ts', 'utf8');
const validator = fs.readFileSync('scripts/validate-provider-wiring.mjs', 'utf8');

test('OpenAI readiness requires explicit spend authorization and operator-supplied pricing', () => {
  for (const marker of [
    'STORYTIME_PROVIDER_SPEND_AUTHORIZED',
    'STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS',
    'STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS',
    'STORYTIME_MAX_GENERATION_COST_USD',
    'STORYTIME_PROVIDER_DAILY_BUDGET_USD',
    'STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD',
    'STORYTIME_OPENAI_MAX_OUTPUT_TOKENS'
  ]) assert.ok(provider.includes(marker), `missing provider budget marker: ${marker}`);
  assert.match(env, /STORYTIME_PROVIDER_SPEND_AUTHORIZED=false/);
  assert.match(readiness, /providerSpendAuthorized: provider\.spendAuthorized === true/);
  assert.match(provider, /globalDailyBudgetUsd/);
  assert.match(provider, /userDailyBudgetUsd/);
  assert.match(validator, /Live provider mode requires STORYTIME_PROVIDER_SPEND_AUTHORIZED=true/);
});

test('provider enforces a conservative pre-call per-request cost ceiling and bounded output', () => {
  assert.match(provider, /Buffer\.byteLength/);
  assert.match(provider, /estimatedMaxCostUsd/);
  assert.match(provider, /configured per-request cost ceiling/);
  assert.match(provider, /max_tokens: pricing\.maxOutputTokens/);
  assert.match(provider, /Math\.min\(2000, Math\.max\(128/);
});

test('successful provider output requires request id, usage and priced receipt evidence', () => {
  assert.match(provider, /storytime-provider-receipt-v1/);
  assert.match(provider, /response\.headers\.get\("x-request-id"\)/);
  assert.match(provider, /payload\.usage\?\.prompt_tokens/);
  assert.match(provider, /payload\.usage\?\.completion_tokens/);
  assert.match(provider, /payload\.usage\?\.total_tokens/);
  assert.match(provider, /Story provider usage receipt is incomplete/);
  assert.match(provider, /costStatus: "priced_from_configured_rates"/);
  assert.match(provider, /actualCostUsd/);
  assert.doesNotMatch(provider, /configuredInputUsdPerMillionTokens:\s*[0-9]+(?:\.[0-9]+)?\s*,/);
});

test('Storytime persists provider receipt and records deterministic execution as zero spend', () => {
  assert.match(storytime, /let providerReceipt: StoryProviderReceipt/);
  assert.match(storytime, /providerReceipt = providerResult\.receipt/);
  assert.match(storytime, /provider: "local_builder"/);
  assert.match(storytime, /actualCostUsd: 0/);
  assert.match(storytime, /costStatus: "no_provider_spend"/);
  const occurrences = storytime.match(/providerReceipt/g) || [];
  assert.ok(occurrences.length >= 5, 'provider receipt should be retained across session/request persistence');
});
