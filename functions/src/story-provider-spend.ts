/** Exact Storytime provider requests enter the canonical Factory v2 gateway once. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { isIP } from "node:net";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";

export const storytimeSpendWorkerTokensSecret = defineSecret("STORYTIME_SPEND_WORKER_TOKENS_JSON");
export type StoryProviderAuthority = { userId: string; requestId: string; reviewedRequestSha256: string };
export type StoryAuthorityCommit = (write: (transaction: Transaction) => void) => Promise<void>;
export type StorySpendReceipt = {
  schemaVersion: "storytime-protected-spend-observation-v1";
  status: "RECONCILIATION_REQUIRED";
  jobId: string; attemptId: string; accountId: string; workerId: string;
  executorSourceSha: string; gatewaySourceSha: string;
  requestSha256: string; sourceInputSha256: string;
  credentialSha256: string; semanticHeadersSha256: string;
  consentReceiptSha256: string; rightsReceiptSha256: string;
  pricingReceipt: string; reservedUsdMicros: number;
  chargesReconciled: false; retryAuthorized: false;
};
type Json = Record<string, unknown>;
export class StorySpendRejected extends Error {
  readonly code = "storytime_protected_spend_required";
  constructor() { super("This Storytime request requires protected spend admission or charge reconciliation. Do not resubmit it."); }
}
function need(value: unknown): asserts value { if (!value) throw new StorySpendRejected(); }
function record(value: unknown): Json {
  need(value !== null && typeof value === "object" && !Array.isArray(value) && Object.prototype.toString.call(value) === "[object Object]");
  return value as Json;
}
function text(value: unknown): string { need(typeof value === "string" && value.trim()); return value; }
function digest(value: unknown, length = 64): string { need(typeof value === "string" && new RegExp(`^[0-9a-f]{${length}}$`).test(value)); return value; }
function integer(value: unknown, minimum = 0): number { need(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum); return value; }
export function storySpendHash(value: string | Uint8Array) { return createHash("sha256").update(value).digest("hex"); }
export function storySourceJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") { need(Number.isFinite(value)); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(storySourceJson).join(",")}]`;
  const object = record(value);
  return `{${Object.keys(object).filter(key => object[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${storySourceJson(object[key])}`).join(",")}}`;
}
function canonical(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value).replace(/[\u007f-\uffff]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  if (value === null || typeof value === "boolean") return String(value);
  if (typeof value === "number") { need(Number.isSafeInteger(value)); return String(value); }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const object = record(value), keys = Object.keys(object).sort();
  need(keys.every(key => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)));
  return `{${keys.map(key => `${canonical(key)}:${canonical(object[key])}`).join(",")}}`;
}
function instant(value: unknown) {
  need(typeof value === "string");
  const parts = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.exec(value); need(parts);
  const [year, month, day, hour, minute, second] = parts.slice(1, 7).map(Number), calendar = new Date(Date.UTC(year, month - 1, day));
  need(calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day && hour < 24 && minute < 60 && second < 60);
  const result = Date.parse(value); need(Number.isFinite(result)); return result;
}
function fresh(value: Json, observed = "observed_at") { need(instant(value[observed]) <= Date.now() && Date.now() < instant(value.expires_at)); }
const REPOSITORY = "LifeLoggerAI/urai-storytime";
const GATEWAY_REPOSITORY = "LifeLoggerAI/asset-factory";
const SOURCE_PATHS = ["functions/src/story-provider.ts", "functions/src/story-provider-spend.ts", "functions/src/storytime.ts"];
/** A configured SHA alone cannot identify the actual executor source. */
export function storySpendSourceSha() {
  const expected = digest(process.env.URAI_SOURCE_SHA, 40);
  try {
    const options = { encoding: "utf8" as const, timeout: 5_000, stdio: ["ignore", "pipe", "pipe"] as ["ignore", "pipe", "pipe"] };
    const root = execFileSync("git", ["-C", process.cwd(), "rev-parse", "--show-toplevel"], options).trim();
    const git = (...args: string[]) => execFileSync("git", ["-C", root, ...args], options).trim();
    need(git("rev-parse", "HEAD") === expected);
    const tracked = git("ls-files", "--error-unmatch", "--", ...SOURCE_PATHS).split("\n");
    need(tracked.length === SOURCE_PATHS.length && SOURCE_PATHS.every(path => tracked.includes(path)));
    need(!git("status", "--porcelain", "--untracked-files=all", "--", ...SOURCE_PATHS));
  } catch { throw new StorySpendRejected(); }
  return expected;
}
function gatewayEndpoint() {
  const value = text(process.env.STORYTIME_PRODUCTION_SPEND_URL);
  let url: URL; try { url = new URL(value); } catch { throw new StorySpendRejected(); }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  need(url.protocol === "https:" && !url.username && !url.password && !url.hash && !url.search && !isIP(host) && !host.startsWith("[") && host.includes(".") && !/(^|\.)(localhost|local|internal)$/.test(host));
  need(url.pathname === "/api/worker/production-spend" && url.toString() === value);
  return value;
}
async function boundedJson(response: Response) {
  need(response.ok && response.body);
  const reader = response.body.getReader(), chunks: Uint8Array[] = []; let count = 0;
  try {
    while (true) { const next = await reader.read(); if (next.done) break; count += next.value.byteLength; if (count > 65_536) { await reader.cancel(); throw new StorySpendRejected(); } chunks.push(next.value); }
  } finally { reader.releaseLock(); }
  try { const value = record(JSON.parse(Buffer.concat(chunks, count).toString("utf8"))); need(value.ok === true); return value; }
  catch { throw new StorySpendRejected(); }
}

type ExactStoryRequest = {
  model: string; body: string; headers: HeadersInit;
  estimatedMaxCostUsd: number; maxGenerationCostUsd: number;
  inputUsdPerMillionTokens: number; outputUsdPerMillionTokens: number;
};
/** Server-only locators do not create grants, approvals, reservations or charge receipts. */
export async function executeProtectedStoryProvider<T>(db: Firestore, authority: StoryProviderAuthority, sourceInput: unknown, exact: ExactStoryRequest, decode: (response: Response) => Promise<T>): Promise<{ result: T; spend: StorySpendReceipt; commitWithAuthority: StoryAuthorityCommit }> {
  text(authority?.userId); text(authority?.requestId); digest(authority?.reviewedRequestSha256);
  const endpoint = "https://api.openai.com/v1/chat/completions", gatewayUrl = gatewayEndpoint();
  const sourceSha = storySpendSourceSha(), gatewaySha = digest(process.env.STORYTIME_SPEND_GATEWAY_SOURCE_SHA, 40);
  const body = exact.body, headers = new Headers(exact.headers), bytes = Buffer.from(body, "utf8");
  need(bytes.length > 0 && bytes.length <= 131_072 && headers.get("content-type") === "application/json");
  const parsed = record(JSON.parse(body)); need(parsed.model === text(exact.model));
  const credential = text(headers.get("authorization")); need(/^Bearer\s+\S+$/.test(credential));
  // These owned copies are the bytes and effective headers dispatched after reservation.
  const credentials = { authorization: credential };
  const credentialSha = storySpendHash(storySourceJson(credentials));
  const semanticSha = storySpendHash(storySourceJson(Object.fromEntries([...headers.entries()].filter(([key]) => key !== "authorization"))));
  const requestSha = storySpendHash(Buffer.concat([Buffer.from(`POST\n${endpoint}\n`), bytes]));
  const inputSha = storySpendHash(storySourceJson({ authority, input: sourceInput }));
  const providerInputSha = storySpendHash(storySourceJson(sourceInput)), tenantSha = storySpendHash(authority.userId);
  const generationId = `${authority.userId}_${authority.requestId}`;
  const locator = storySpendHash(storySourceJson({ user_id: authority.userId, request_id: authority.requestId, reviewed_request_sha256: authority.reviewedRequestSha256, request_sha256: requestSha, source_input_sha256: inputSha }));
  const readAuthority = async (transaction: Transaction) => {
    const [claimSnapshot, bindingSnapshot] = await Promise.all([
      transaction.get(db.doc(`storyGenerationRequests/${generationId}`)),
      transaction.get(db.doc(`storytimePaidProviderBindings/${locator}`))
    ]);
    need(claimSnapshot.exists && bindingSnapshot.exists);
    const claim = record(claimSnapshot.data()), binding = record(bindingSnapshot.data());
    const consentSnapshot = record(claim.consentSnapshot);
    need(claim.userId === authority.userId && claim.requestId === authority.requestId && claim.status === "processing" && claim.cancellationRequested !== true);
    need(claim.reviewedRequestSha256 === authority.reviewedRequestSha256 && claim.providerInputSha256 === providerInputSha && claim.consentVersion === "story-generation-consent-v1");
    need(consentSnapshot.storyGeneration === true && consentSnapshot.providerProcessing === true && consentSnapshot.consentVersion === claim.consentVersion);
    need(binding.user_id === authority.userId && binding.request_id === authority.requestId && binding.generation_request_id === generationId && binding.reviewed_request_sha256 === authority.reviewedRequestSha256);
    need(binding.provider === "openai" && binding.request_sha256 === requestSha && binding.source_input_sha256 === inputSha && binding.executor_source_sha === sourceSha && binding.gateway_source_sha === gatewaySha && binding.credential_sha256 === credentialSha && binding.semantic_headers_sha256 === semanticSha);
    need(binding.trusted_readback === true && binding.revoked !== true); text(binding.receipt); fresh(binding);
    const consentDigest = digest(binding.consent_receipt_sha256), rightsDigest = digest(binding.rights_receipt_sha256);
    const [consentProof, rightsProof] = await Promise.all([
      transaction.get(db.doc(`storytimeProviderConsentReceipts/${consentDigest}`)),
      transaction.get(db.doc(`storytimeProviderRightsReceipts/${rightsDigest}`))
    ]);
    need(consentProof.exists && rightsProof.exists);
    const consent = record(consentProof.data()), rights = record(rightsProof.data());
    for (const proof of [consent, rights]) {
      need(proof.user_id === authority.userId && proof.request_id === authority.requestId && proof.generation_request_id === generationId && proof.reviewed_request_sha256 === authority.reviewedRequestSha256 && proof.source_input_sha256 === inputSha);
      need(proof.purpose === "storytime.generate" && proof.provider === "openai" && proof.trusted_readback === true && proof.revoked !== true); text(proof.receipt); fresh(proof);
    }
    need(consent.status === "GRANTED" && consent.story_generation === true && consent.provider_processing === true && consent.consent_version === claim.consentVersion);
    need(rights.status === "APPROVED" && rights.rights_reviewed === true);
    need(storySpendHash(storySourceJson(consent)) === consentDigest && storySpendHash(storySourceJson(rights)) === rightsDigest);
    return { binding, consentDigest, rightsDigest };
  };
  const loadAuthority = () => db.runTransaction(readAuthority);
  const initial = await loadAuthority(), binding = initial.binding;
  const workerId = text(binding.worker_id), jobId = text(binding.job_id), accountId = text(binding.account_id);
  let tokens: Json; try { tokens = record(JSON.parse(storytimeSpendWorkerTokensSecret.value())); } catch { throw new StorySpendRejected(); }
  const token = text(tokens[workerId]); need(token.length >= 32);
  const fields = {
    job_id: jobId, worker_id: workerId, executor_repository: REPOSITORY, executor_source_sha: sourceSha,
    gateway_repository: GATEWAY_REPOSITORY, gateway_source_sha: gatewaySha, consumer: "storytime-generation",
    tenant_sha256: tenantSha, provider: "openai", account_id: accountId, credential_sha256: credentialSha,
    source_input_sha256: inputSha, semantic_headers_sha256: semanticSha, content_type: "application/json",
    request_sha256: requestSha, endpoint, model: exact.model, asset: `storytime/${tenantSha}/${authority.requestId}/session`, request_size: String(bytes.length)
  };
  const verifySource = () => {
    need(storySpendSourceSha() === sourceSha && process.env.STORYTIME_SPEND_GATEWAY_SOURCE_SHA === gatewaySha && gatewayEndpoint() === gatewayUrl);
    need(storySpendHash(storySourceJson({ authority, input: sourceInput })) === inputSha);
  };
  const verifyCurrent = async () => {
    verifySource();
    const current = await loadAuthority(); need(storySourceJson(current) === storySourceJson(initial));
  };
  // Only Firestore reads and story writes may repeat on a transaction conflict.
  // Provider dispatch and canonical admission remain outside this transaction.
  const commitWithAuthority: StoryAuthorityCommit = write => db.runTransaction(async transaction => {
    verifySource();
    const current = await readAuthority(transaction); need(storySourceJson(current) === storySourceJson(initial));
    verifySource();
    write(transaction);
  });
  const gateway = async (action: string, extra: Json = {}) => {
    // An uncertain reserve or observation is never automatically retried.
    try { return await boundedJson(await fetch(gatewayUrl, { method: "POST", redirect: "error", cache: "no-store", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ action, ...fields, ...extra }), signal: AbortSignal.timeout(15_000) })); }
    catch { throw new StorySpendRejected(); }
  };
  const prepared = await gateway("preflight"); need(prepared.provider_call_authorized === false && prepared.execution_performed === false);
  const envelope = record(prepared.envelope), job = record(envelope.job), executor = record(job.executor), jobAuthority = record(job.authority), budget = record(job.budget);
  const bound = { job_id: job.job_id, worker_id: executor.worker_id, executor_repository: executor.repository, executor_source_sha: executor.source_sha, gateway_repository: executor.gateway_repository, gateway_source_sha: executor.gateway_source_sha, consumer: job.consumer, tenant_sha256: executor.tenant_sha256, provider: job.provider, account_id: job.account_id, credential_sha256: executor.credential_sha256, source_input_sha256: executor.source_input_sha256, semantic_headers_sha256: executor.semantic_headers_sha256, content_type: executor.content_type, request_sha256: executor.request_sha256, endpoint: executor.endpoint, model: job.model_version, asset: executor.asset, request_size: executor.request_size };
  need(storySourceJson(bound) === storySourceJson(fields) && executor.binding_version === 2 && job.rights_reviewed === true);
  need(jobAuthority.repository === REPOSITORY && jobAuthority.sha === sourceSha);
  const inputs = job.input_sha256; need(Array.isArray(inputs) && [inputSha, requestSha, initial.consentDigest, initial.rightsDigest].every(value => inputs.includes(value)));
  digest(executor.deployment_ref); digest(executor.controls_ref);
  const account = record(envelope.account), controls = record(envelope.protected_controls), price = record(envelope.protected_pricing), rates = record(budget.rates);
  need(account.provider === "openai" && account.account_id === accountId && account.credential_sha256 === credentialSha && account.credential_binding_verified === true && account.trusted_readback === true); text(account.credential_binding_receipt); fresh(account);
  for (const key of ["credential_sha256", "semantic_headers_sha256", "source_input_sha256", "content_type"] as const) need(controls[key] === fields[key] && price[key] === fields[key]);
  need(controls.provider === "openai" && controls.account_id === accountId && controls.enforcement_source_sha === gatewaySha && controls.endpoint === endpoint && controls.request_sha256 === requestSha && controls.trusted_readback === true && controls.hard_stop_supported === true && controls.cost_cap_enforced === true && controls.auto_top_up === false); text(controls.proof_receipt); fresh(controls);
  for (const key of ["max_usd_micros", "max_credits", "max_runtime_seconds"]) need(controls[key] === budget[key]);
  need(price.provider === "openai" && price.account_id === accountId && price.model_version === exact.model && price.request_sha256 === requestSha && price.trusted_readback === true); text(price.receipt); fresh(price); fresh(rates, "verified_at");
  need(canonical(price.rates) === canonical(rates)); text(rates.receipt);
  // Configured rates remain observations only and must match the fresh protected quote.
  const inputRate = integer(exact.inputUsdPerMillionTokens * 1_000_000, 1), outputRate = integer(exact.outputUsdPerMillionTokens * 1_000_000, 1);
  need(rates.input_usd_micros_per_million_tokens === inputRate && rates.output_usd_micros_per_million_tokens === outputRate);
  const cap = integer(budget.max_usd_micros, 1), runtime = integer(budget.max_runtime_seconds, 1);
  need(Number.isFinite(exact.estimatedMaxCostUsd) && exact.estimatedMaxCostUsd > 0 && Number.isFinite(exact.maxGenerationCostUsd) && exact.maxGenerationCostUsd > 0);
  need(integer(rates.usd_micros_per_unit, 1) >= Math.ceil(exact.estimatedMaxCostUsd * 1_000_000) && cap <= Math.floor(exact.maxGenerationCostUsd * 1_000_000) && budget.max_retries === 0 && runtime <= 20);
  const jobDigest = storySpendHash(canonical(Object.fromEntries(Object.entries(job).filter(([key]) => key !== "approval" && key !== "attempts"))));
  await verifyCurrent();
  const admitted = await gateway("reserve", { job_digest: jobDigest });
  need(admitted.provider_call_authorized === true && admitted.execution_performed === false && admitted.executor_source_sha === sourceSha && admitted.gateway_source_sha === gatewaySha && admitted.worker_id === workerId && admitted.job_digest === jobDigest && admitted.max_runtime_seconds === runtime);
  for (const key of ["account_id", "credential_sha256", "semantic_headers_sha256", "source_input_sha256", "content_type"] as const) need(admitted[key] === fields[key]);
  const attemptId = text(admitted.attempt_id), controller = new AbortController();
  const deadline = Date.now() + runtime * 1000, timer = setTimeout(() => controller.abort(), runtime * 1000);
  let outcome: "succeeded" | "failed" = "failed", requestId: string | undefined;
  const current = () => { need(!controller.signal.aborted && Date.now() < deadline); };
  try {
    await verifyCurrent(); fresh(account); fresh(controls); fresh(price); fresh(rates, "verified_at"); current();
    const run = async () => {
      const response = await fetch(endpoint, { method: "POST", headers, body: bytes, redirect: "error", cache: "no-store", signal: controller.signal });
      current(); requestId = response.headers.get("x-request-id") || undefined;
      const result = await decode(response); current(); await verifyCurrent(); current();
      return result;
    };
    const result = await new Promise<T>((resolve, reject) => {
      const abort = () => reject(new StorySpendRejected()); controller.signal.addEventListener("abort", abort, { once: true });
      run().then(resolve, reject).finally(() => controller.signal.removeEventListener("abort", abort));
    });
    current(); outcome = "succeeded";
    return { result, commitWithAuthority, spend: { schemaVersion: "storytime-protected-spend-observation-v1", status: "RECONCILIATION_REQUIRED", jobId, attemptId, accountId, workerId, executorSourceSha: sourceSha, gatewaySourceSha: gatewaySha, requestSha256: requestSha, sourceInputSha256: inputSha, credentialSha256: credentialSha, semanticHeadersSha256: semanticSha, consentReceiptSha256: initial.consentDigest, rightsReceiptSha256: initial.rightsDigest, pricingReceipt: text(price.receipt), reservedUsdMicros: cap, chargesReconciled: false, retryAuthorized: false } };
  } finally {
    clearTimeout(timer); controller.abort();
    // An outcome never settles funds. A failed observation also leaves the hold intact.
    const observed = await gateway("record", { attempt_id: attemptId, status: outcome, ...(requestId ? { request_id: requestId.slice(0, 256) } : {}) }).catch(() => null);
    if (outcome === "succeeded") {
      need(observed && observed.provider_call_authorized === false && observed.execution_performed === false && observed.reconciliation_required === true);
      // Recording may await the gateway. Fence returned output against authority
      // changes during that final await as well.
      await verifyCurrent();
      need(Date.now() < deadline);
    }
  }
}
