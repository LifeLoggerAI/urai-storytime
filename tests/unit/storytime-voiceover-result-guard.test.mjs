import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const guardSource = readFileSync("functions/src/storytime-voiceover-result-guard.ts", "utf8");
const { confirmedStorytimeOutputDeletion, hasStorytimeOutputTombstone } = await import(
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
  assert.match(manage,/hasStorytimeOutputTombstone\(current\)\) return false/);
  assert.match(manage,/Current voiceover playback authority is unavailable/);
  assert.doesNotMatch(manage,/await voiceoverRef\.set\(/);
});
