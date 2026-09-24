import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const provider = fs.readFileSync('functions/src/story-provider.ts', 'utf8');
const storytime = fs.readFileSync('functions/src/storytime.ts', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');

test('provider preflight requires global and per-user daily dollar budgets', () => {
  for (const marker of [
    'STORYTIME_PROVIDER_DAILY_BUDGET_USD',
    'STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD',
    'globalDailyBudgetUsd',
    'userDailyBudgetUsd',
    'getStoryProviderCostPreflight'
  ]) assert.ok(provider.includes(marker), `missing daily-budget marker: ${marker}`);
  assert.match(env, /STORYTIME_PROVIDER_DAILY_BUDGET_USD=/);
  assert.match(env, /STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD=/);
});

test('paid provider work reserves conservative spend before generateStoryWithProvider', () => {
  const reserveIndex = storytime.indexOf('budgetReservation = await reserveProviderBudget');
  const providerIndex = storytime.indexOf('const providerResult = await generateStoryWithProvider');
  assert.ok(reserveIndex >= 0, 'budget reservation must exist');
  assert.ok(providerIndex > reserveIndex, 'provider call must occur after reservation');
  assert.match(storytime, /storytime-provider-budget-reservation-v1/);
  assert.match(storytime, /storytimeProviderBudgetCounters/);
  assert.match(storytime, /storytimeProviderBudgetReservations/);
});

test('global and per-user daily ceilings fail before provider execution', () => {
  assert.match(storytime, /globalActual \+ globalReserved \+ estimate > preflight\.globalDailyBudgetUsd/);
  assert.match(storytime, /userActual \+ userReserved \+ estimate > preflight\.userDailyBudgetUsd/);
  assert.match(storytime, /Storytime provider daily budget is exhausted/);
  assert.match(storytime, /Your Storytime provider daily budget is exhausted/);
  assert.match(storytime, /generation_blocked_budget/);
});

test('successful provider usage settles reservation to actual receipt cost', () => {
  assert.match(storytime, /settleProviderBudget\(userId, budgetReservation, providerReceipt\.actualCostUsd\)/);
  assert.match(storytime, /reservedCostUsd: roundedUsd\(Math\.max\(0, globalReserved - reserved\)\)/);
  assert.match(storytime, /actualCostUsd: roundedUsd\(globalActual \+ actualCostUsd\)/);
  assert.match(storytime, /status: "settled"/);
  assert.match(storytime, /providerBudgetStatus: "settled"/);
});

test('uncertain failures retain conservative reservation instead of undercounting spend', () => {
  assert.match(storytime, /holdProviderBudgetReservation/);
  assert.match(storytime, /status: "held_after_failure"/);
  assert.match(storytime, /heldCostUsd: reservation\.estimatedMaxCostUsd/);
  assert.match(storytime, /providerBudgetStatus: budgetReservation \? "held_after_failure" : "not_reserved"/);
  assert.match(storytime, /budget_settlement_failed/);
});

test('provider budget ledgers are server-only', () => {
  assert.match(rules, /match \/storytimeProviderBudgetCounters\/\{id\} \{ allow read, write: if false; \}/);
  assert.match(rules, /match \/storytimeProviderBudgetReservations\/\{id\} \{ allow read, write: if false; \}/);
});
