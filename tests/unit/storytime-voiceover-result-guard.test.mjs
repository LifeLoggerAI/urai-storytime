import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const guardSource = readFileSync("functions/src/storytime-voiceover-result-guard.ts", "utf8");
const { boundStorytimeRemoteJob, confirmedStorytimeOutputDeletion, hasStorytimeOutputTombstone, preservedStorytimeTerminalStatus } = await import(
  "data:text/javascript;base64," + Buffer.from(stripTypeScriptTypes(guardSource)).toString("base64")
);
const source = readFileSync("functions/src/storytime.ts", "utf8");
const manage = source.slice(source.indexOf("export const manageVoiceoverJob = onCall"));

test("only an exact downstream Jobs deletion receipt confirms private output erasure", () => {
  assert.equal(confirmedStorytimeOutputDeletion({ok:true,deletion:{deleted:true}}),true);
  assert.equal(confirmedStorytimeOutputDeletion({ok:true,deletion:{deleted:true,alreadyDeleted:true}}),true);
  for (const response of [
    {ok:true}, {ok:true,deletion:null}, {ok:true,deletion:false},
    {ok:true,deletion:{deleted:false}}, {ok:true,deletion:{deleted:"true"}},
    {ok:true,deletion:{deleted:1}}, {ok:true,deletion:[]},
    {ok:true,job:{status:"CANCELLED"}}
  ]) assert.equal(confirmedStorytimeOutputDeletion(response),false);
});

test("local output tombstone persists independently of stale remote job status", () => {
  assert.equal(hasStorytimeOutputTombstone({status:"output_deleted"}),true);
  assert.equal(hasStorytimeOutputTombstone({status:"queued",outputDeletedAt:"2026-10-14T00:00:00Z"}),true);
  assert.equal(hasStorytimeOutputTombstone({status:"SUCCESS",outputDeletedAt:{seconds:12}}),true);
  assert.equal(hasStorytimeOutputTombstone({status:"queued"}),false);
  assert.equal(hasStorytimeOutputTombstone({status:"SUCCESS",outputDeletedAt:null}),false);
});

test("callable checks the deletion receipt before writing a local output tombstone", () => {
  const receipt = manage.indexOf("if (!confirmedStorytimeOutputDeletion(bridge))");
  const write = manage.indexOf('status: "output_deleted"');
  assert.ok(receipt >= 0 && write > receipt);
  assert.match(manage,/Downstream narrator output deletion is not confirmed/);
  assert.match(manage,/transaction\.get\(voiceoverRef\)/);
  assert.match(manage,/hasStorytimeOutputTombstone\(current\)\) return "OUTPUT_DELETED"/);
  assert.match(manage,/Current voiceover playback authority is unavailable/);
  assert.doesNotMatch(manage,/await voiceoverRef\.set\(/);
});

test("status/cancel projections must match exactly the original Jobs identity", () => {
  const expected = "01JXBOUNDVOICE001";
  const projection = { jobId: expected, status: "CANCELLED", output: { mimeType: "audio/mpeg" } };
  assert.deepEqual(boundStorytimeRemoteJob({ ok: true, job: projection }, expected), projection);
  for (const response of [
    { ok: true }, { ok: true, job: null }, { ok: true, job: [] },
    { ok: true, job: { status: "CANCELLED" } },
    { ok: true, job: { ...projection, jobId: "foreign-worker-job" } },
    { ok: true, job: { ...projection, status: "" } },
    { ok: true, job: { ...projection, status: 1 } }
  ]) assert.equal(boundStorytimeRemoteJob(response, expected), null);
  const identity = manage.indexOf("const job = boundStorytimeRemoteJob(bridge, externalJobId);");
  const write = manage.indexOf("transaction.update(voiceoverRef", identity);
  assert.ok(identity >= 0 && write > identity);
  assert.match(manage, /Remote narrator job identity is unavailable/);
});

test("a delayed status cannot regress a local terminal job", () => {
  assert.equal(preservedStorytimeTerminalStatus({ status: "cancelled" }, "RUNNING"), "CANCELLED");
  assert.equal(preservedStorytimeTerminalStatus({ status: "failed" }, "PENDING"), "FAILED");
  assert.equal(preservedStorytimeTerminalStatus({ status: "success" }, "RUNNING"), "SUCCESS");
  assert.equal(preservedStorytimeTerminalStatus({ status: "completed" }, "SUCCESS"), null);
  assert.equal(preservedStorytimeTerminalStatus({ status: "cancellation_requested" }, "RUNNING"), "CANCELLATION_REQUESTED");
  assert.equal(preservedStorytimeTerminalStatus({ status: "cancelled" }, "CANCELLED"), null);
  assert.equal(preservedStorytimeTerminalStatus({ status: "queued" }, "RUNNING"), null);
  const fence = manage.indexOf("preservedStorytimeTerminalStatus(current, status)");
  const write = manage.indexOf("transaction.update(voiceoverRef", fence);
  assert.ok(fence >= 0 && write > fence);
});
