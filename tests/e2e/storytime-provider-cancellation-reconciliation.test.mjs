import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storytime = readFileSync("functions/src/storytime.ts", "utf8");
const index = readFileSync("functions/src/index.ts", "utf8");
const audit = readFileSync("functions/src/audit-log.ts", "utf8");
const rules = readFileSync("firestore.rules", "utf8");

test("generation cancellation is owner-authenticated and blocks completed results", () => {
  assert.match(storytime, /export const cancelStoryGeneration = onCall/);
  assert.match(storytime, /requireAuth\(request\.auth\?\.uid\)/);
  assert.match(storytime, /data\.userId !== userId/);
  assert.match(storytime, /data\.status === "succeeded"/);
  assert.match(storytime, /status: "cancellation_requested"/);
  assert.match(storytime, /cancellationRequested: true/);
});

test("cancelled provider output is never persisted as a story", () => {
  const providerCall = storytime.indexOf("generateStoryWithProvider(providerInput)");
  const cancellationCheck = storytime.indexOf("isGenerationCancellationRequested(userId, input.requestId)", providerCall);
  const storyBatch = storytime.indexOf('db.collection("storySessions").doc(sessionId)', cancellationCheck);
  assert.ok(providerCall > -1);
  assert.ok(cancellationCheck > providerCall);
  assert.ok(storyBatch > cancellationCheck);
  assert.match(storytime.slice(cancellationCheck, storyBatch), /throw new HttpsError\("cancelled"/);
});

test("reconciliation queue is admin-only and returns metadata without raw story content", () => {
  assert.match(storytime, /export const listStorytimeProviderReconciliationQueue = onCall/);
  assert.match(storytime, /requireAdmin\(request\.auth\?\.token/);
  assert.match(storytime, /storytimeProviderDeadLetters/);
  assert.match(storytime, /requires_provider_receipt_reconciliation/);
  assert.match(storytime, /containsRawStoryContent: false/);
  assert.doesNotMatch(storytime, /items:[\s\S]{0,1600}(sourceText|momentBody|narratorText|prompt)/);
});

test("server-only provider ledgers remain client-inaccessible", () => {
  assert.match(rules, /storytimeProviderBudgetReservations\/\{id\} \{ allow read, write: if false; \}/);
  assert.match(rules, /storytimeProviderDeadLetters\/\{id\} \{ allow read, write: if false; \}/);
  assert.match(rules, /storyGenerationRequests\/\{id\} \{ allow read, write: if false; \}/);
});

test("new callables and audit events are exported and typed", () => {
  assert.match(index, /cancelStoryGeneration/);
  assert.match(index, /listStorytimeProviderReconciliationQueue/);
  assert.match(audit, /"generation_cancellation_requested"/);
  assert.match(audit, /"generation_cancelled"/);
  assert.match(audit, /"provider_reconciliation_viewed"/);
});
