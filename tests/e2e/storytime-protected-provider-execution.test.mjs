import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import * as gate from '../fixtures/canonical-spend-gateway-acea7ea.ts';

const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { z } = require('zod');
const repositoryRoot = process.cwd();
const sha = value => createHash('sha256').update(value).digest('hex');
const gitBlob = value => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${value.length}\0`), value])).digest('hex');
const currentProviderSource = readFileSync('functions/src/story-provider.ts', 'utf8');
const callerSource = readFileSync('functions/src/storytime.ts', 'utf8');
const helperSource = readFileSync('functions/src/story-provider-spend.ts', 'utf8');
const priorHelperSource = readFileSync('tests/fixtures/story-provider-spend-before-3cbd61d.ts', 'utf8');
const priorCallerSource = readFileSync('tests/fixtures/storytime-before-output-confirmation-da2bba1.ts', 'utf8');
const originalProviderSource = readFileSync('tests/fixtures/story-provider-before-9178b98.ts', 'utf8');
let sequence = 0;
const importSource = source => import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);
const helper = await importSource(helperSource.replace('import { defineSecret } from "firebase-functions/params";', 'const defineSecret = () => ({ value: () => process.env.STORYTIME_SPEND_WORKER_TOKENS_JSON });'));
const priorHelper = await importSource(priorHelperSource.replace('import { defineSecret } from "firebase-functions/params";', 'const defineSecret = () => ({ value: () => process.env.STORYTIME_SPEND_WORKER_TOKENS_JSON });'));
const persistence = await importSource(readFileSync('functions/src/story-persistence.ts', 'utf8'));
const envKeys = ['URAI_SOURCE_SHA', 'STORYTIME_SPEND_GATEWAY_SOURCE_SHA', 'STORYTIME_PRODUCTION_SPEND_URL', 'STORYTIME_SPEND_WORKER_TOKENS_JSON', 'STORYTIME_GENERATION_PROVIDER', 'OPENAI_API_KEY', 'STORYTIME_OPENAI_MODEL', 'STORYTIME_PROVIDER_SPEND_AUTHORIZED', 'STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS', 'STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS', 'STORYTIME_MAX_GENERATION_COST_USD', 'STORYTIME_PROVIDER_DAILY_BUDGET_USD', 'STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD', 'STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER'];
const signingPair = () => { const pair = generateKeyPairSync('ed25519'); return { privateKey: pair.privateKey, publicKey: pair.publicKey.export({ type: 'spki', format: 'pem' }) }; };
const approver = signingPair(), reconciler = signingPair(), verifier = signingPair();
const signed = (record, pair) => ({ ...record, signature: sign(null, Buffer.from(gate.canonical(record)), pair.privateKey).toString('base64') });
const gatewayUrl = 'https://synthetic-factory.example.invalid/api/worker/production-spend';
const gatewayHead = 'acea7eaf1ccec8ce34bff99ebb8eb527a7b67098';

function storage() {
  const rows = new Map(); let pending = Promise.resolve();
  const snapshot = ref => { const exists = rows.has(ref.path), value = structuredClone(rows.get(ref.path)); return { id: ref.id, exists, ref, data: () => structuredClone(value) }; };
  const put = (ref, data, merge) => {
    const value = merge ? { ...rows.get(ref.path), ...structuredClone(data) } : structuredClone(data);
    for (const [key, next] of Object.entries(value)) if (next?.increment !== undefined) value[key] = (rows.get(ref.path)?.[key] || 0) + next.increment;
    rows.set(ref.path, value);
  };
  const doc = p => ({ path: p, id: p.split('/').at(-1), get: async () => snapshot(doc(p)), set: async (value, options) => put(doc(p), value, options?.merge), update: async value => put(doc(p), value, true) });
  const writer = (atomic = false) => {
    const staged = [], reads = new Map(); const transaction = {
      get: async ref => { const value = snapshot(ref); reads.set(ref.path, JSON.stringify(value.data())); return value; },
      set: (ref, value, options) => { staged.push(['set', ref, value, options?.merge]); return transaction; },
      create: (ref, value) => { staged.push(['create', ref, value]); return transaction; },
      update: (ref, value) => { staged.push(['update', ref, value, true]); return transaction; },
      commit: async () => {
        if (atomic) {
          await db.beforeTransactionCommit?.(staged);
          for (const [p, value] of reads) if (JSON.stringify(rows.get(p)) !== value) throw new Error('synthetic transaction conflict');
        }
        for (const [kind, ref] of staged) { if (kind === 'create' && rows.has(ref.path)) throw new Error('already exists'); if (kind === 'update' && !rows.has(ref.path)) throw new Error('missing'); }
        for (const [, ref, value, merge] of staged) put(ref, value, merge);
        if (atomic) await db.afterTransactionCommit?.(staged);
      }
    }; return transaction;
  };
  const db = {
    doc,
    collection: name => ({ doc: id => doc(`${name}/${id}`) }),
    batch: writer,
    runTransaction: callback => {
      const result = pending.then(async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          const transaction = writer(true);
          try { const result = await callback(transaction); await transaction.commit(); return result; }
          catch (error) { if (error.message !== 'synthetic transaction conflict') throw error; }
        }
        throw new Error('synthetic transaction retries exhausted');
      });
      pending = result.catch(() => {}); return result;
    }
  };
  return { db, rows };
}
async function provider(execute = helper.executeProtectedStoryProvider, before = false) {
  const key = `story-provider-execute-${++sequence}`; globalThis[key] = execute;
  const raw = before ? originalProviderSource : currentProviderSource;
  const source = stripTypeScriptTypes(raw).replace(/^import[\s\S]*?from "[^\"]+";\n/gm, '');
  try { return await importSource(`const executeProtectedStoryProvider = globalThis[${JSON.stringify(key)}];\n${source}`); }
  finally { delete globalThis[key]; }
}
async function callables(f, beforeOutputConfirmation = false) {
  const key = `story-provider-callable-${++sequence}`;
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  globalThis[key] = { initializeApp: () => {}, FieldValue: { increment: value => ({ increment: value }) }, getFirestore: () => f.db, HttpsError, onCall: (...args) => args.at(-1), defineSecret: () => ({ value: () => 'SYNTHETIC-unused-bridge' }), z, auditLog: () => {}, reconcileStoryPersistence: persistence.reconcileStoryPersistence, buildInitialStoryVersionRecord: value => value, ...helper, ...f.provider };
  const source = stripTypeScriptTypes(beforeOutputConfirmation ? priorCallerSource : callerSource).replace(/^import[\s\S]*?from "[^\"]+";\n/gm, '');
  try { return await importSource(`import { createHash } from 'node:crypto'; const { initializeApp, FieldValue, getFirestore, HttpsError, onCall, defineSecret, z, auditLog, reconcileStoryPersistence, buildInitialStoryVersionRecord, storySourceJson, storySpendHash, storytimeSpendWorkerTokensSecret, generateStoryWithProvider, getStoryProviderCostPreflight, getStoryProviderReadiness } = globalThis[${JSON.stringify(key)}];\n${source}`); }
  finally { delete globalThis[key]; }
}
const syntheticInput = () => ({ title: 'SYNTHETIC story', sourceText: 'A synthetic tree grows in a fictional garden.', emotionalTone: 'gentle', symbolicMotifs: ['tree'], locale: 'en-US', audienceAgeBand: 'family' });
const callableInput = input => ({ ...input, requestId: 'synthetic-request', sourceSignals: [], operator: { role: 'adult_or_guardian', affirmed: true }, requestReview: { reviewed: true, reviewVersion: 'story-request-review-v1' }, consentSnapshot: { storyGeneration: true, providerProcessing: true, consentVersion: 'story-generation-consent-v1', voiceover: false, publicSharing: false, memoryUse: false } });
const reviewedHash = input => sha(JSON.stringify({ title: input.title, sourceText: input.sourceText ?? '', emotionalTone: input.emotionalTone, symbolicMotifs: input.symbolicMotifs, sourceSignals: input.sourceSignals, locale: input.locale, audienceAgeBand: input.audienceAgeBand, operator: input.operator, requestReview: input.requestReview, consentSnapshot: input.consentSnapshot }));
const providerPayload = () => ({ id: 'synthetic-provider-task', model: 'synthetic-model', usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 }, choices: [{ message: { content: JSON.stringify({ chapterTitle: 'A synthetic garden', momentBody: 'A fictional tree grew.', narratorText: 'The tree grew gently.' }) } }] });

async function fixture(run) {
  const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]])), originalFetch = globalThis.fetch;
  const temp = mkdtempSync(path.join(tmpdir(), 'storytime-spend-synthetic-'));
  for (const [file, content] of [['story-provider.ts', currentProviderSource], ['story-provider-spend.ts', helperSource], ['storytime.ts', callerSource]]) { const p = path.join(temp, 'functions/src', file); mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, content); }
  const git = args => execFileSync('git', ['-C', temp, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git(['init', '-q']); git(['add', '.']); git(['-c', 'user.name=Synthetic fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Synthetic clean-source fixture; not production provenance']);
  Object.assign(process.env, { URAI_SOURCE_SHA: git(['rev-parse', 'HEAD']), STORYTIME_SPEND_GATEWAY_SOURCE_SHA: gatewayHead, STORYTIME_PRODUCTION_SPEND_URL: gatewayUrl, STORYTIME_SPEND_WORKER_TOKENS_JSON: JSON.stringify({ 'synthetic-worker': 'SYNTHETIC-worker-token-never-production-000' }), STORYTIME_GENERATION_PROVIDER: 'openai', OPENAI_API_KEY: 'SYNTHETIC-api-key-never-production', STORYTIME_OPENAI_MODEL: 'synthetic-model', STORYTIME_PROVIDER_SPEND_AUTHORIZED: 'true', STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS: '1', STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS: '2', STORYTIME_MAX_GENERATION_COST_USD: '.01', STORYTIME_PROVIDER_DAILY_BUDGET_USD: '1', STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD: '.5', STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER: 'false' });
  process.chdir(temp);
  try {
    const f = storage(); f.provider = await provider(); f.input = syntheticInput(); f.callableInput = callableInput(f.input);
    f.authority = { userId: 'synthetic-owner', requestId: f.callableInput.requestId, reviewedRequestSha256: reviewedHash(f.callableInput) };
    let exact;
    const probe = await provider(async (...args) => { exact = args[3]; return { result: { output: {}, receipt: {} }, spend: {} }; });
    await probe.generateStoryWithProvider(f.input, f.authority, f.db);
    f.exact = exact; f.gatewayActions = []; f.providerRequests = []; f.fetchHook = undefined;
    const now = Date.now(), observed = new Date(now - 1000).toISOString(), expires = new Date(now + 600_000).toISOString();
    const inputHash = sha(helper.storySourceJson({ authority: f.authority, input: f.input })), requestHash = sha(Buffer.concat([Buffer.from('POST\nhttps://api.openai.com/v1/chat/completions\n'), Buffer.from(exact.body)]));
    const normalized = new Headers(exact.headers), credentialHash = sha(helper.storySourceJson({ authorization: normalized.get('authorization') })), semanticHash = sha(helper.storySourceJson(Object.fromEntries([...normalized].filter(([key]) => key !== 'authorization'))));
    const generationId = `${f.authority.userId}_${f.authority.requestId}`;
    const common = { user_id: f.authority.userId, request_id: f.authority.requestId, generation_request_id: generationId, reviewed_request_sha256: f.authority.reviewedRequestSha256, source_input_sha256: inputHash, provider: 'openai', purpose: 'storytime.generate', trusted_readback: true, revoked: false, receipt: 'SYNTHETIC-NOT-A-GRANT', observed_at: observed, expires_at: expires };
    const consent = { ...common, status: 'GRANTED', story_generation: true, provider_processing: true, consent_version: 'story-generation-consent-v1' }, rights = { ...common, status: 'APPROVED', rights_reviewed: true };
    const consentHash = sha(helper.storySourceJson(consent)), rightsHash = sha(helper.storySourceJson(rights));
    f.claimPath = `storyGenerationRequests/${generationId}`;
    f.consentPath = `storytimeProviderConsentReceipts/${consentHash}`; f.rightsPath = `storytimeProviderRightsReceipts/${rightsHash}`;
    f.rows.set(f.claimPath, { userId: f.authority.userId, requestId: f.authority.requestId, status: 'processing', reviewedRequestSha256: f.authority.reviewedRequestSha256, providerInputSha256: sha(helper.storySourceJson(f.input)), consentVersion: 'story-generation-consent-v1', consentSnapshot: f.callableInput.consentSnapshot });
    const locator = sha(helper.storySourceJson({ user_id: f.authority.userId, request_id: f.authority.requestId, reviewed_request_sha256: f.authority.reviewedRequestSha256, request_sha256: requestHash, source_input_sha256: inputHash }));
    f.bindingPath = `storytimePaidProviderBindings/${locator}`;
    f.rows.set(f.bindingPath, { ...common, job_id: 'SYNTHETIC-story-job', worker_id: 'synthetic-worker', account_id: 'SYNTHETIC-api-account', request_sha256: requestHash, executor_source_sha: process.env.URAI_SOURCE_SHA, gateway_url: gatewayUrl, gateway_source_sha: gatewayHead, credential_sha256: credentialHash, semantic_headers_sha256: semanticHash, consent_receipt_sha256: consentHash, rights_receipt_sha256: rightsHash });
    f.rows.set(f.consentPath, consent); f.rows.set(f.rightsPath, rights);
    const fields = { job_id: 'SYNTHETIC-story-job', worker_id: 'synthetic-worker', executor_repository: 'LifeLoggerAI/urai-storytime', executor_source_sha: process.env.URAI_SOURCE_SHA, gateway_repository: 'LifeLoggerAI/asset-factory', gateway_source_sha: gatewayHead, consumer: 'storytime-generation', tenant_sha256: sha(f.authority.userId), provider: 'openai', account_id: 'SYNTHETIC-api-account', credential_sha256: credentialHash, source_input_sha256: inputHash, semantic_headers_sha256: semanticHash, content_type: 'application/json', request_sha256: requestHash, endpoint: 'https://api.openai.com/v1/chat/completions', model: 'synthetic-model', asset: `storytime/${sha(f.authority.userId)}/${f.authority.requestId}/session`, request_size: String(Buffer.byteLength(exact.body)) };
    const budget = { currency: 'USD', max_usd_micros: 10_000, max_credits: 0, units: 1, max_retries: 0, max_runtime_seconds: 20, hard_stop_supported: true, auto_top_up: false, storage_egress_overhead_usd_micros: 0, rates: { usd_micros_per_unit: 5_000, credits_per_unit: 0, input_usd_micros_per_million_tokens: 1_000_000, output_usd_micros_per_million_tokens: 2_000_000, receipt: 'SYNTHETIC-NOT-A-PRICE', verified_at: observed, expires_at: expires } };
    const controls = signed({ ...fields, binding: fields, verified: true, trusted_readback: true, deployment_id: 'SYNTHETIC-NOT-A-DEPLOYMENT', proof_receipt: 'SYNTHETIC-NOT-A-VERIFICATION', observed_at: observed, expires_at: expires, enforcement_source_sha: gatewayHead, max_usd_micros: budget.max_usd_micros, max_credits: 0, max_runtime_seconds: budget.max_runtime_seconds, hard_stop_supported: true, cost_cap_enforced: true, auto_top_up: false, verifier: 'synthetic-verifier', key_id: 'verify' }, verifier);
    const deployment = signed({ binding: fields, verified: true, trusted_readback: true, deployment_id: controls.deployment_id, proof_receipt: 'SYNTHETIC-NOT-A-DEPLOYMENT', observed_at: observed, expires_at: expires, verifier: 'synthetic-verifier', key_id: 'verify' }, verifier);
    const controlsHash = gate.hash(gate.canonical(controls)), deploymentHash = gate.hash(gate.canonical(deployment));
    const pricing = { ...fields, model_version: 'synthetic-model', trusted_readback: true, receipt: 'SYNTHETIC-NOT-A-PRICE', observed_at: observed, expires_at: expires, rates: budget.rates };
    const pricingHash = gate.hash(gate.canonical(pricing)), authorityHash = sha('SYNTHETIC-authority');
    const inputs = [inputHash, requestHash, consentHash, rightsHash];
    const job = { schema_version: 1, job_id: fields.job_id, provider: 'openai', account_id: fields.account_id, operation: 'storytime.generate', model_version: fields.model, owner_lane: 'storytime', consumer: fields.consumer, truth_class: 'INTERPRETIVE', rights_reviewed: true, authority: { repository: fields.executor_repository, sha: fields.executor_source_sha }, authority_ref: authorityHash, input_sha256: inputs, reuse_review: { input_sha256: inputs, decision: 'MISSING_COMPONENT', receipt: 'SYNTHETIC-NOT-A-RIGHTS-REVIEW' }, acceptance: { stage: 'SPECIFIED', criteria: 'synthetic output', verification: 'synthetic review' }, expected_outputs: ['synthetic story'], budget, pricing_ref: pricingHash, executor: { binding_version: 2, repository: fields.executor_repository, source_sha: fields.executor_source_sha, gateway_repository: fields.gateway_repository, gateway_source_sha: gatewayHead, worker_id: fields.worker_id, tenant_sha256: fields.tenant_sha256, credential_sha256: credentialHash, source_input_sha256: inputHash, semantic_headers_sha256: semanticHash, content_type: fields.content_type, request_sha256: requestHash, endpoint: fields.endpoint, asset: fields.asset, request_size: fields.request_size, deployment_ref: deploymentHash, controls_ref: controlsHash }, approval_ref: sha('SYNTHETIC-approval'), attempts: [] };
    const approval = signed({ status: 'APPROVED', kind: 'EXPLICIT_BOUNDED_SPEND', job_digest: gate.jobDigest(job), max_usd_micros: 10_000, max_credits: 0, receipt: 'SYNTHETIC-NOT-AN-APPROVAL', approver: 'synthetic-approver', key_id: 'approve', issued_at: observed, expires_at: expires }, approver);
    const account = { provider: 'openai', account_id: fields.account_id, credential_sha256: credentialHash, credential_binding_verified: true, credential_binding_receipt: 'SYNTHETIC-NOT-ACCOUNT-PROOF', balance_type: 'API', trusted_readback: true, available_usd_micros: 100_000, available_credits: 0, observed_at: observed, expires_at: expires, reservations: [] };
    f.jobPath = `assetFactorySpendJobs/${gate.hash(job.job_id)}`; f.accountPath = `assetFactorySpendAccounts/${gate.hash(`openai\n${fields.account_id}`)}`; f.pricePath = `assetFactorySpendPricing/${pricingHash}`; f.controlsPath = `assetFactorySpendControls/${controlsHash}`; f.approvalPath = `assetFactorySpendApprovals/${job.approval_ref}`;
    f.rows.set(f.jobPath, { job }); f.rows.set(f.accountPath, account); f.rows.set(f.pricePath, pricing); f.rows.set(f.controlsPath, controls); f.rows.set(`assetFactorySpendDeployments/${deploymentHash}`, deployment); f.rows.set(f.approvalPath, approval); f.rows.set(`assetFactorySpendAuthorities/${authorityHash}`, { binding: job.authority, trusted_readback: true, observed_at: observed, expires_at: expires });
    const registry = { 'synthetic-worker': { token: 'SYNTHETIC-worker-token-never-production-000', executor_repository: fields.executor_repository, executor_source_sha: fields.executor_source_sha, consumer: fields.consumer, tenant_sha256: fields.tenant_sha256, provider: 'openai', account_id: fields.account_id, credential_sha256: credentialHash } };
    f.gateway = async body => gate.spendAction(f.db, body.action, body, { now: Date.now, sourceSha: gatewayHead, worker: gate.authenticateSpendWorker(registry, 'SYNTHETIC-worker-token-never-production-000'), approvalKeys: { approve: { subject: 'synthetic-approver', publicKey: approver.publicKey } }, reconciliationKeys: { reconcile: { subject: 'synthetic-reconciler', publicKey: reconciler.publicKey } }, verifierKeys: { verify: { subject: 'synthetic-verifier', publicKey: verifier.publicKey } } });
    globalThis.fetch = async (url, init) => {
      if (String(url) === gatewayUrl) {
        const body = JSON.parse(init.body); f.gatewayActions.push(body.action);
        if (f.fetchHook) { const response = await f.fetchHook('gateway', body, init); if (response) return response; }
        try { return Response.json(await f.gateway(body)); } catch { return Response.json({ ok: false }, { status: 409 }); }
      }
      assert.equal(String(url), 'https://api.openai.com/v1/chat/completions');
      f.providerRequests.push({ url: String(url), body: Buffer.from(init.body).toString('utf8'), headers: Object.fromEntries(new Headers(init.headers)), signal: init.signal, redirect: init.redirect });
      if (f.fetchHook) { const response = await f.fetchHook('provider', undefined, init); if (response) return response; }
      return Response.json(providerPayload(), { headers: { 'x-request-id': 'synthetic-provider-request' } });
    };
    f.generate = () => f.provider.generateStoryWithProvider(f.input, f.authority, f.db);
    f.generateCallable = async (beforeOutputConfirmation = false) => { f.rows.delete(f.claimPath); const c = await callables(f, beforeOutputConfirmation); return c.generateStorySession({ auth: { uid: f.authority.userId, token: { email_verified: true } }, data: f.callableInput }); };
    return await run(f);
  } finally { process.chdir(repositoryRoot); globalThis.fetch = originalFetch; for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } rmSync(temp, { recursive: true, force: true }); }
}

test('source fixture pins actual gateway and original provider Git blobs', () => {
  assert.equal(gitBlob(readFileSync('tests/fixtures/canonical-spend-gateway-acea7ea.ts')), 'e547456c428c8e9f60e66162286cfb452f5ef89d');
  assert.equal(gitBlob(readFileSync('tests/fixtures/story-provider-spend-before-3cbd61d.ts')), 'daf5bbae7e40ac1447d7f97c373515aafb190768');
  assert.equal(gitBlob(readFileSync('tests/fixtures/storytime-before-output-confirmation-da2bba1.ts')), 'da2bba15efe31853a9a892415aa0bdf24022e308');
  assert.equal(gitBlob(readFileSync('tests/fixtures/story-provider-before-9178b98.ts')), '9178b980a5d4287b5537169bc6fbee933220a567');
});
test('actual predecessor dispatches under environment-only authority and mislabels priced usage as actual', () => fixture(async f => {
  const baseline = await provider(undefined, true); const result = await baseline.generateStoryWithProvider(f.input);
  assert.equal(f.providerRequests.length, 1); assert.deepEqual(f.gatewayActions, []);
  assert.equal(result.receipt.actualCostUsd, .00025); assert.equal(result.receipt.costStatus, 'priced_from_configured_rates');
}));
test('actual provider dispatches frozen bytes once through real v2 gateway and keeps unresolved account hold', () => fixture(async f => {
  const result = await f.generate();
  assert.equal(f.providerRequests.length, 1); assert.equal(f.providerRequests[0].body, f.exact.body); assert.equal(f.providerRequests[0].redirect, 'error');
  assert.deepEqual(f.gatewayActions, ['preflight', 'reserve', 'record']);
  assert.equal(result.receipt.actualCostUsd, null); assert.equal(result.receipt.observedCostUsd, .00025); assert.equal(result.receipt.settlementStatus, 'RECONCILIATION_REQUIRED');
  assert.equal(result.receipt.spend.chargesReconciled, false); assert.equal(result.receipt.spend.retryAuthorized, false);
  assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
  assert.equal(f.rows.get(f.jobPath).job.attempts[0].status, 'RECONCILIATION_REQUIRED');
}));
for (const [name, mutate] of [
  ['missing mapping', f => f.rows.delete(f.bindingPath)],
  ['foreign owner', f => f.rows.get(f.bindingPath).user_id = 'foreign'],
  ['foreign request', f => f.rows.get(f.bindingPath).generation_request_id = 'other'],
  ['changed source authority', f => f.rows.get(f.bindingPath).executor_source_sha = 'a'.repeat(40)],
  ['cancelled processing claim', f => f.rows.get(f.claimPath).cancellationRequested = true],
  ['changed reviewed source', f => f.rows.get(f.claimPath).reviewedRequestSha256 = 'a'.repeat(64)],
  ['changed provider input', f => f.rows.get(f.claimPath).providerInputSha256 = 'a'.repeat(64)],
  ['absent owner consent', f => f.rows.get(f.claimPath).consentSnapshot.providerProcessing = false],
  ['missing protected consent', f => f.rows.delete(f.consentPath)],
  ['revoked protected consent', f => f.rows.get(f.consentPath).revoked = true],
  ['expired protected consent', f => f.rows.get(f.consentPath).expires_at = new Date(Date.now() - 1000).toISOString()],
  ['missing reviewed rights', f => f.rows.delete(f.rightsPath)],
  ['changed rights digest', f => f.rows.get(f.rightsPath).receipt = 'changed'],
  ['unverified account credential', f => f.rows.get(f.accountPath).credential_binding_verified = false],
  ['missing signed approval', f => f.rows.delete(f.approvalPath)],
  ['invalid signed approval', f => f.rows.get(f.approvalPath).signature = 'YQ=='],
  ['expired protected pricing', f => f.rows.get(f.pricePath).expires_at = new Date(Date.now() - 1000).toISOString()],
  ['changed protected token rates', f => f.rows.get(f.pricePath).rates.input_usd_micros_per_million_tokens++],
  ['unbound wire credentials', () => process.env.OPENAI_API_KEY = 'SYNTHETIC-other-credential'],
  ['unavailable genuine gateway', f => f.fetchHook = kind => kind === 'gateway' ? Response.json({ ok: false }, { status: 503 }) : undefined],
  ['declared source differs from tracked head', () => process.env.URAI_SOURCE_SHA = 'a'.repeat(40)],
  ['dirty actual provider source', () => writeFileSync('functions/src/story-provider.ts', `${currentProviderSource}\n// dirty synthetic test`) ]
]) test(`actual provider rejects ${name} before any paid POST`, () => fixture(async f => { mutate(f); await assert.rejects(f.generate()); assert.equal(f.providerRequests.length, 0); }));
test('configuration readiness never reports request spend authority', () => fixture(async f => { assert.equal(f.provider.getStoryProviderReadiness().ready, true); assert.equal(f.provider.getStoryProviderReadiness().spendAuthorized, false); }));
test('environment-only gateway redirect cannot leak a worker token or fabricate a shared-account admission', () => fixture(async f => {
  const originalFetch = globalThis.fetch, fakeUrl = 'https://synthetic-impostor.example.invalid/api/worker/production-spend';
  let fakeGatewayCalls = 0;
  process.env.STORYTIME_PRODUCTION_SPEND_URL = fakeUrl;
  globalThis.fetch = async (url, init) => {
    if (String(url) !== fakeUrl) return originalFetch(url, init);
    fakeGatewayCalls++;
    const body = JSON.parse(init.body);
    if (body.action === 'preflight') {
      const prepared = await f.gateway(body);
      f.rows.get(f.accountPath).reservations = [{ job_id: 'SYNTHETIC-other-unknown-hold', usd_micros: 95_000, credits: 0 }];
      return Response.json(prepared);
    }
    if (body.action === 'reserve') return Response.json({ ok: true, provider_call_authorized: true, execution_performed: false, attempt_id: 'SYNTHETIC-fabricated-reserve', job_digest: body.job_digest, executor_source_sha: body.executor_source_sha, gateway_source_sha: body.gateway_source_sha, worker_id: body.worker_id, max_runtime_seconds: 20, account_id: body.account_id, credential_sha256: body.credential_sha256, semantic_headers_sha256: body.semantic_headers_sha256, source_input_sha256: body.source_input_sha256, content_type: body.content_type });
    return Response.json({ ok: true, provider_call_authorized: false, execution_performed: false, reconciliation_required: true });
  };
  await assert.rejects(f.generate());
  assert.equal(fakeGatewayCalls, 0); assert.equal(f.providerRequests.length, 0);
  assert.equal(f.rows.get(f.jobPath).job.attempts.length, 0); assert.equal(f.rows.get(f.accountPath).reservations.length, 0);
}));
test('credential environment changes after preflight cannot replace frozen dispatched authorization', () => fixture(async f => {
  f.fetchHook = (kind, body) => { if (kind === 'gateway' && body.action === 'preflight') process.env.OPENAI_API_KEY = 'SYNTHETIC-changed-after-freeze'; };
  await f.generate(); assert.equal(f.providerRequests[0].headers.authorization, 'Bearer SYNTHETIC-api-key-never-production');
}));
test('lost reserve reply retains canonical hold and never dispatches or repeats reserve', () => fixture(async f => {
  f.fetchHook = async (kind, body) => { if (kind === 'gateway' && body.action === 'reserve') { await f.gateway(body); throw new Error('synthetic reply lost'); } };
  await assert.rejects(f.generate()); assert.equal(f.providerRequests.length, 0); assert.deepEqual(f.gatewayActions, ['preflight', 'reserve']);
  assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000); assert.equal(f.rows.get(f.jobPath).job.attempts.length, 1);
}));
test('revocation during reserve await fences paid dispatch and keeps the admitted hold', () => fixture(async f => {
  f.fetchHook = async (kind, body) => { if (kind === 'gateway' && body.action === 'reserve') { const result = await f.gateway(body); f.rows.get(f.consentPath).revoked = true; return Response.json(result); } };
  await assert.rejects(f.generate()); assert.equal(f.providerRequests.length, 0); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
}));
test('provider failure is observed without settlement or automatic second POST', () => fixture(async f => {
  f.fetchHook = kind => kind === 'provider' ? Response.json({ error: 'synthetic' }, { status: 429 }) : undefined;
  await assert.rejects(f.generate()); assert.equal(f.providerRequests.length, 1); assert.deepEqual(f.gatewayActions, ['preflight', 'reserve', 'record']);
  assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000); assert.equal(f.rows.get(f.jobPath).job.attempts[0].reported_outcome, 'failed');
}));
test('lost outcome observation withholds success and keeps the uncertain reservation', () => fixture(async f => {
  f.fetchHook = (kind, body) => { if (kind === 'gateway' && body.action === 'record') throw new Error('synthetic observation lost'); };
  await assert.rejects(f.generate()); assert.equal(f.providerRequests.length, 1); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
}));
test('revocation during outcome recording withholds returned story output and retains its hold', () => fixture(async f => {
  f.fetchHook = async (kind, body) => { if (kind === 'gateway' && body.action === 'record') { const result = await f.gateway(body); f.rows.get(f.consentPath).revoked = true; return Response.json(result); } };
  await assert.rejects(f.generate()); assert.equal(f.providerRequests.length, 1); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
}));
test('record and final authority awaits cannot return output after the protected deadline', () => fixture(async f => {
  const originalNow = Date.now;
  f.fetchHook = async (kind, body) => { if (kind === 'gateway' && body.action === 'record') { const result = await f.gateway(body); Date.now = () => originalNow() + 21_000; return Response.json(result); } };
  try { await assert.rejects(f.generate()); } finally { Date.now = originalNow; }
  assert.equal(f.providerRequests.length, 1); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
  assert.equal(f.rows.get(f.jobPath).job.attempts[0].status, 'RECONCILIATION_REQUIRED');
}));
test('one protected deadline covers a stalled response body and retains its unresolved hold', () => fixture(async f => {
  const originalTimer = globalThis.setTimeout;
  // Advance only the admitted 20-second HTTP lifetime, without waiting in CI.
  globalThis.setTimeout = (fn, ms, ...args) => originalTimer(fn, ms > 0 && ms <= 20_000 ? 25 : ms, ...args);
  f.fetchHook = kind => kind === 'provider' ? new Response(new ReadableStream({ start(controller) {
    f.providerRequests.at(-1).signal.addEventListener('abort', () => controller.error(new Error('synthetic body abort')), { once: true });
  } }), { headers: { 'x-request-id': 'synthetic-stalled-body' } }) : undefined;
  try { await assert.rejects(f.generate()); } finally { globalThis.setTimeout = originalTimer; }
  assert.equal(f.providerRequests.length, 1); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
  assert.equal(f.rows.get(f.jobPath).job.attempts[0].reported_outcome, 'failed');
}));
test('bad reservation echo prevents dispatch while the canonical admitted hold remains', () => fixture(async f => {
  f.fetchHook = async (kind, body) => { if (kind === 'gateway' && body.action === 'reserve') { const result = await f.gateway(body); return Response.json({ ...result, credential_sha256: 'a'.repeat(64) }); } };
  await assert.rejects(f.generate()); assert.equal(f.providerRequests.length, 0); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
}));
test('unknown existing daily holds count against the next request and block dispatch', () => fixture(async f => {
  const d = new Date(), day = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  f.rows.set(`storytimeProviderBudgetCounters/global_${day}`, { actualCostUsd: 0, reservedCostUsd: .995 });
  await assert.rejects(f.generateCallable(), error => error.code === 'resource-exhausted'); assert.equal(f.providerRequests.length, 0); assert.deepEqual(f.gatewayActions, []);
  assert.equal(f.rows.get(`storytimeProviderBudgetCounters/global_${day}`).reservedCostUsd, .995);
}));
test('actual callable preserves both full daily holds after successful provider usage', () => fixture(async f => {
  const result = await f.generateCallable(); assert.equal(result.status, 'ready');
  const counters = [...f.rows.entries()].filter(([p]) => p.startsWith('storytimeProviderBudgetCounters/')).map(([, value]) => value);
  assert.equal(counters.length, 2); for (const value of counters) { assert.equal(value.reservedCostUsd, .01); assert.equal(value.actualCostUsd, 0); }
  const reservation = f.rows.get(`storytimeProviderBudgetReservations/${f.authority.userId}_${f.authority.requestId}`);
  assert.equal(reservation.status, 'awaiting_charge_reconciliation'); assert.equal(reservation.actualCostUsd, null); assert.equal(reservation.observedCostUsd, .00025); assert.equal(reservation.heldCostUsd, .01); assert.equal(reservation.retryAuthorized, false);
  assert.equal(f.rows.get(f.claimPath).providerBudgetStatus, 'awaiting_charge_reconciliation');
}));
test('revocation during caller budget bookkeeping prevents every paid story write and retains holds', () => fixture(async f => {
  const originalCollection = f.db.collection;
  f.db.collection = name => {
    const collection = originalCollection(name);
    if (name !== 'storytimeProviderDeadLetters') return collection;
    return { ...collection, doc: id => {
      const ref = collection.doc(id), originalSet = ref.set;
      return { ...ref, set: async (...args) => { await originalSet(...args); f.rows.get(f.consentPath).revoked = true; } };
    } };
  };
  await assert.rejects(f.generateCallable());
  assert.equal([...f.rows.keys()].filter(p => p.startsWith('storySessions/')).length, 0);
  assert.equal(f.rows.get(f.claimPath).status, 'requires_reconciliation');
  assert.equal(f.providerRequests.length, 1); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
  for (const [p, value] of f.rows) if (p.startsWith('storytimeProviderBudgetCounters/')) assert.equal(value.reservedCostUsd, .01);
}));
test('late cancellation after the caller snapshot cannot be overwritten by paid output persistence', () => fixture(async f => {
  const originalCollection = f.db.collection;
  f.db.collection = name => {
    const collection = originalCollection(name);
    if (name !== 'storyGenerationRequests') return collection;
    return { ...collection, doc: id => {
      const ref = collection.doc(id), originalGet = ref.get;
      return { ...ref, get: async () => {
        const value = await originalGet();
        if (value.data()?.providerBudgetStatus === 'awaiting_charge_reconciliation') Object.assign(f.rows.get(f.claimPath), { status: 'cancellation_requested', cancellationRequested: true });
        return value;
      } };
    } };
  };
  await assert.rejects(f.generateCallable());
  assert.equal([...f.rows.keys()].filter(p => p.startsWith('storySessions/')).length, 0);
  assert.equal(f.rows.get(f.claimPath).status, 'requires_reconciliation'); assert.equal(f.rows.get(f.claimPath).cancellationRequested, true);
  assert.equal(f.providerRequests.length, 1); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
}));
test('rights revocation at paid persistence commit conflicts and rechecks the grant without another POST', () => fixture(async f => {
  f.db.beforeTransactionCommit = async staged => {
    if (staged.some(([, ref]) => ref.path.startsWith('storySessions/'))) f.rows.get(f.rightsPath).revoked = true;
  };
  await assert.rejects(f.generateCallable());
  assert.equal([...f.rows.keys()].filter(p => p.startsWith('storySessions/')).length, 0);
  assert.equal(f.rows.get(f.claimPath).status, 'requires_reconciliation'); assert.equal(f.providerRequests.length, 1);
  assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
}));
test('lost paid persistence acknowledgement uses actual reconciliation without another provider dispatch', () => fixture(async f => {
  f.db.afterTransactionCommit = async staged => {
    if (staged.some(([, ref]) => ref.path.startsWith('storySessions/'))) throw new Error('synthetic acknowledgement lost after atomic commit');
  };
  const result = await f.generateCallable(); assert.equal(result.status, 'ready');
  assert.equal([...f.rows.keys()].filter(p => p.startsWith('storySessions/')).length, 1);
  assert.equal(f.rows.get(f.claimPath).status, 'succeeded'); assert.equal(f.providerRequests.length, 1);
  assert.deepEqual(f.gatewayActions, ['preflight', 'reserve', 'record']);
  for (const [p, value] of f.rows) if (p.startsWith('storytimeProviderBudgetCounters/')) assert.equal(value.reservedCostUsd, .01);
}));
test('actual callable preserves unknown holds and terminal retry barrier after a lost reservation response', () => fixture(async f => {
  f.fetchHook = async (kind, body) => { if (kind === 'gateway' && body.action === 'reserve') { await f.gateway(body); throw new Error('synthetic lost response'); } };
  await assert.rejects(f.generateCallable()); assert.equal(f.rows.get(f.claimPath).status, 'requires_reconciliation');
  const before = f.gatewayActions.length; const c = await callables(f);
  await assert.rejects(c.generateStorySession({ auth: { uid: f.authority.userId, token: { email_verified: true } }, data: f.callableInput }), error => error.code === 'failed-precondition');
  assert.equal(f.gatewayActions.length, before); assert.equal(f.providerRequests.length, 0);
  for (const [p, value] of f.rows) if (p.startsWith('storytimeProviderBudgetCounters/')) assert.equal(value.reservedCostUsd, .01);
}));
for (const value of [NaN, -1, '0']) test(`actual daily budget rejects malformed stored counter ${String(value)}`, () => fixture(async f => {
  const d = new Date(), day = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  f.rows.set(`storytimeProviderBudgetCounters/global_${day}`, { reservedCostUsd: value });
  await assert.rejects(f.generateCallable(), error => error.code === 'failed-precondition'); assert.equal(f.providerRequests.length, 0); assert.deepEqual(f.gatewayActions, []);
}));

for (const [action, field] of [['preflight', 'admission_expires_at'], ['reserve', 'reserved_at'], ['reserve', 'admission_expires_at']]) {
 test(`missing absolute ${action} ${field} rejects before provider dispatch`, () => fixture(async f => {
  f.fetchHook = async (kind, body) => { if (kind === 'gateway' && body.action === action) { const reply = await f.gateway(body); delete reply[field]; return Response.json(reply); } };
  await assert.rejects(f.generate()); assert.equal(f.providerRequests.length, 0);
  if (action === 'reserve') assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
 }));
}
test('approval expiry during a delayed reserve reply rejects without dispatch and retains admission hold', () => fixture(async f => {
 const originalNow = Date.now; let clock = originalNow(); Date.now = () => clock;
 const { signature, ...approval } = f.rows.get(f.approvalPath);
 f.rows.set(f.approvalPath, signed({ ...approval, expires_at: new Date(clock + 2_000).toISOString() }, approver));
 f.fetchHook = async (kind, body) => { if (kind === 'gateway' && body.action === 'reserve') { const reply = await f.gateway(body); clock += 6_000; return Response.json(reply); } };
 try { await assert.rejects(f.generate()); } finally { Date.now = originalNow; }
 assert.equal(f.providerRequests.length, 0); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
}));
test('reserve-response latency cannot restart the admitted runtime for decoding', () => fixture(async f => {
 const originalNow = Date.now; const started = originalNow(); let clock = started; Date.now = () => clock;
 f.fetchHook = async (kind, body) => {
  if (kind === 'gateway' && body.action === 'reserve') { const reply = await f.gateway(body); clock += 6_000; return Response.json(reply); }
  if (kind === 'provider') { clock = started + 21_000; return Response.json(providerPayload()); }
 };
 try { await assert.rejects(f.generate()); } finally { Date.now = originalNow; }
 assert.equal(f.providerRequests.length, 1); assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
}));
test('paid persistence cannot write a story after its absolute admission expires during caller bookkeeping', () => fixture(async f => {
 const originalNow = Date.now; const started = originalNow(); let clock = started; Date.now = () => clock;
 const originalCollection = f.db.collection;
 f.db.collection = name => {
  const collection = originalCollection(name); if (name !== 'storytimeProviderDeadLetters') return collection;
  return { ...collection, doc: id => { const ref = collection.doc(id), set = ref.set; return { ...ref, set: async (...args) => { await set(...args); clock = started + 21_000; } }; } };
 };
 try { await assert.rejects(f.generateCallable()); } finally { Date.now = originalNow; }
 assert.equal([...f.rows.keys()].filter(p => p.startsWith('storySessions/')).length, 0);
 assert.equal(f.providerRequests.length, 1); assert.equal(f.rows.get(f.claimPath).status, 'requires_reconciliation');
}));

function shortApproval(f, clock) {
  const { signature, ...approval } = f.rows.get(f.approvalPath);
  f.rows.set(f.approvalPath, signed({ ...approval, expires_at: new Date(clock + 2000).toISOString() }, approver));
}
function fullCallableHolds(f) {
  assert.equal(f.rows.get(f.accountPath).reservations[0].usd_micros, 10_000);
  const counters = [...f.rows.entries()].filter(([p]) => p.startsWith('storytimeProviderBudgetCounters/'));
  assert.equal(counters.length, 2);
  for (const [, value] of counters) { assert.equal(value.reservedCostUsd, .01); assert.equal(value.actualCostUsd, 0); }
  assert.equal(f.providerRequests.length, 1);
  assert.deepEqual(f.gatewayActions, ['preflight', 'reserve', 'record']);
}
function committedStory(f) {
  const entries = [...f.rows.entries()].filter(([p]) => p.startsWith('storySessions/'));
  assert.equal(entries.length, 1);
  assert.equal(f.rows.get(f.claimPath).status, 'succeeded');
  return entries[0][1];
}
for (const lost of [false, true]) test('actual current predecessor returns paid output after expired ' + (lost ? 'lost' : 'normal') + ' persistence acknowledgement', () => fixture(async f => {
  const originalNow = Date.now; let clock = originalNow(); Date.now = () => clock;
  shortApproval(f, clock);
  f.provider = await provider(priorHelper.executeProtectedStoryProvider);
  f.db.afterTransactionCommit = async staged => {
    if (!staged.some(([, ref]) => ref.path.startsWith('storySessions/'))) return;
    clock += 6000;
    if (lost) throw new Error('synthetic acknowledgement lost after expiry');
  };
  try { const result = await f.generateCallable(true); assert.equal(result.status, 'ready'); }
  finally { Date.now = originalNow; }
  committedStory(f); fullCallableHolds(f);
}));
for (const lost of [false, true]) test('actual current predecessor returns paid output after rights revocation during ' + (lost ? 'lost' : 'normal') + ' persistence acknowledgement', () => fixture(async f => {
  f.provider = await provider(priorHelper.executeProtectedStoryProvider);
  f.db.afterTransactionCommit = async staged => {
    if (!staged.some(([, ref]) => ref.path.startsWith('storySessions/'))) return;
    f.rows.get(f.rightsPath).revoked = true;
    if (lost) throw new Error('synthetic acknowledgement lost after rights revocation');
  };
  const result = await f.generateCallable(true); assert.equal(result.status, 'ready');
  committedStory(f); fullCallableHolds(f);
}));
for (const lost of [false, true]) test('expired ' + (lost ? 'lost' : 'normal') + ' persistence acknowledgement withholds paid output and retains committed success', () => fixture(async f => {
  const originalNow = Date.now; let clock = originalNow(); Date.now = () => clock;
  shortApproval(f, clock);
  f.db.afterTransactionCommit = async staged => {
    if (!staged.some(([, ref]) => ref.path.startsWith('storySessions/'))) return;
    clock += 6000;
    if (lost) throw new Error('synthetic acknowledgement lost after expired commit');
  };
  try { await assert.rejects(f.generateCallable(), error => error.code === 'unavailable'); }
  finally { Date.now = originalNow; }
  committedStory(f); fullCallableHolds(f);
}));
for (const lost of [false, true]) test('rights revocation during ' + (lost ? 'lost' : 'normal') + ' persistence acknowledgement withholds paid output after actual commit', () => fixture(async f => {
  f.db.afterTransactionCommit = async staged => {
    if (!staged.some(([, ref]) => ref.path.startsWith('storySessions/'))) return;
    f.rows.get(f.rightsPath).revoked = true;
    if (lost) throw new Error('synthetic acknowledgement lost after revoked commit');
  };
  await assert.rejects(f.generateCallable(), error => error.code === 'unavailable');
  committedStory(f); fullCallableHolds(f);
}));
for (const lost of [false, true]) test('changed executor source during ' + (lost ? 'lost' : 'normal') + ' persistence acknowledgement cannot return committed paid output', () => fixture(async f => {
  f.db.afterTransactionCommit = async staged => {
    if (!staged.some(([, ref]) => ref.path.startsWith('storySessions/'))) return;
    writeFileSync('functions/src/story-provider.ts', currentProviderSource + '\n// dirty after synthetic commit');
    if (lost) throw new Error('synthetic acknowledgement lost after source change');
  };
  await assert.rejects(f.generateCallable(), error => error.code === 'unavailable');
  committedStory(f); fullCallableHolds(f);
}));
for (const [name, mutate] of [
  ['foreign persisted owner', session => { session.userId = 'synthetic-foreign-owner'; }],
  ['foreign persisted request', session => { session.requestId = 'synthetic-foreign-request'; }],
  ['different persisted attempt', session => { session.providerReceipt.spend.attemptId = 'synthetic-other-attempt'; }],
  ['changed persisted reviewed input', session => { session.requestReview.processedRequestSha256 = 'a'.repeat(64); }]
]) test('final committed-output confirmation rejects ' + name + ' without another dispatch', () => fixture(async f => {
  f.db.afterTransactionCommit = async staged => {
    if (!staged.some(([, ref]) => ref.path.startsWith('storySessions/'))) return;
    mutate(committedStory(f));
  };
  await assert.rejects(f.generateCallable(), error => error.code === 'unavailable');
  committedStory(f); fullCallableHolds(f);
}));
test('an expiry during the final authority transaction withholds committed output after its awaited read', () => fixture(async f => {
  const originalNow = Date.now; let clock = originalNow(); Date.now = () => clock;
  f.rows.get(f.bindingPath).expires_at = new Date(clock + 2000).toISOString();
  const runTransaction = f.db.runTransaction;
  f.db.runTransaction = callback => runTransaction(async transaction => {
    const result = await callback(transaction);
    if (f.rows.get(f.claimPath)?.status === 'succeeded' && result?.binding) clock += 6000;
    return result;
  });
  try { await assert.rejects(f.generateCallable(), error => error.code === 'unavailable'); }
  finally { Date.now = originalNow; }
  committedStory(f); fullCallableHolds(f);
}));
test('revocation at final authority transaction commit conflicts and rechecks the current grant without dispatch', () => fixture(async f => {
  f.db.beforeTransactionCommit = async staged => {
    if (staged.length === 0 && f.rows.get(f.claimPath)?.status === 'succeeded') f.rows.get(f.consentPath).revoked = true;
  };
  await assert.rejects(f.generateCallable(), error => error.code === 'unavailable');
  committedStory(f); fullCallableHolds(f);
}));
