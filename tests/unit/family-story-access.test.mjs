import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

// Reuses the repository's existing Node 22 source-contract test pattern.
const src = readFileSync("src/lib/storytime/family-story-access.ts", "utf8");
const { evaluateFamilyStoryAccess } = await import(
  "data:text/javascript;base64," + Buffer.from(stripTypeScriptTypes(src)).toString("base64")
);

const source = () => ({
  storyId: "synthetic-story-a",
  ownerUid: "synthetic-grandparent",
  sourceRevision: "synthetic-version-1",
  shareEpoch: 2,
  lifecycle: "active",
  ownerAccountActive: true,
  sourceConsentActive: true,
  replayConsentActive: true
});
const grant = () => ({
  grantId: "synthetic-grant-1",
  storyId: "synthetic-story-a",
  ownerUid: "synthetic-grandparent",
  recipientUid: "synthetic-adult-child",
  sourceRevision: "synthetic-version-1",
  shareEpoch: 2,
  status: "active",
  ownerApproved: true,
  scopes: ["view_story"],
  issuedAtMs: 1000,
  expiresAtMs: 9000
});
const owner = () => ({ uid: "synthetic-grandparent", verified: true });
const recipient = () => ({ uid: "synthetic-adult-child", verified: true });
const another = () => ({ uid: "synthetic-cousin", verified: true });
const decide = (overrides = {}) =>
  evaluateFamilyStoryAccess({
    actor: recipient(), story: source(), grant: grant(), action: "view_story", nowMs: 2000, ...overrides
  });
const denied = (result, reason) => {
  assert.equal(result.allowed, false);
  assert.equal(result.reason, reason);
};

test("a verified owner can view an active, consented story", () => {
  assert.deepEqual(decide({ actor: owner(), grant: null }), { allowed: true, reason: "owner" });
});
test("a verified named recipient can view only the exact granted story", () => {
  assert.deepEqual(decide(), { allowed: true, reason: "named_grant" });
});
test("owner replay requires separate active replay consent", () => {
  denied(decide({ actor: owner(), action: "view_replay", story: { ...source(), replayConsentActive: false } }), "replay_consent_inactive");
});
test("verified owner replay is allowed when replay consent is active", () => {
  assert.deepEqual(decide({ actor: owner(), action: "view_replay", grant: null }), { allowed: true, reason: "owner" });
});

for (const [name, overrides, reason] of [
  ["no signed-in actor", { actor: null }, "unauthenticated"],
  ["unverified login", { actor: { uid: recipient().uid, verified: false } }, "unauthenticated"],
  ["empty actor", { actor: { uid: "", verified: true } }, "unauthenticated"],
  ["untrusted clock", { nowMs: NaN }, "unauthenticated"],
  ["missing story", { story: null }, "source_unavailable"],
  ["deletion pending", { story: { ...source(), lifecycle: "deleting" } }, "source_unavailable"],
  ["deleted story", { story: { ...source(), lifecycle: "deleted" } }, "source_unavailable"],
  ["removed owner", { story: { ...source(), ownerAccountActive: false } }, "source_unavailable"],
  ["missing source revision", { story: { ...source(), sourceRevision: "" } }, "source_unavailable"],
  ["invalid story epoch", { story: { ...source(), shareEpoch: -1 } }, "source_unavailable"],
  ["revoked source consent", { story: { ...source(), sourceConsentActive: false } }, "consent_inactive"],
  ["no grant", { grant: null }, "grant_missing"],
  ["no implicit kinship access", { actor: another(), grant: null }, "grant_missing"],
  ["other relative is not named recipient", { actor: another() }, "grant_invalid"],
  ["different owner", { grant: { ...grant(), ownerUid: "synthetic-another" } }, "grant_invalid"],
  ["different story", { grant: { ...grant(), storyId: "synthetic-story-b" } }, "grant_invalid"],
  ["unapproved grant", { grant: { ...grant(), ownerApproved: false } }, "grant_invalid"],
  ["invalid grant id", { grant: { ...grant(), grantId: "" } }, "grant_invalid"],
  ["non-array scope", { grant: { ...grant(), scopes: null } }, "grant_invalid"],
  ["revoked grant", { grant: { ...grant(), status: "revoked" } }, "grant_inactive"],
  ["already expired status", { grant: { ...grant(), status: "expired" } }, "grant_inactive"],
  ["outdated source revision", { grant: { ...grant(), sourceRevision: "synthetic-version-0" } }, "grant_stale"],
  ["revoked share epoch", { story: { ...source(), shareEpoch: 3 } }, "grant_stale"],
  ["expired at this instant", { nowMs: 9000 }, "grant_expired"],
  ["future-issued grant", { grant: { ...grant(), issuedAtMs: 5000 } }, "grant_expired"],
  ["bad expiry interval", { grant: { ...grant(), expiresAtMs: 1000 } }, "grant_expired"],
  ["unknown requested scope", { action: "download_raw_media" }, "scope_denied"],
  ["replay absent from named grant", { action: "view_replay" }, "scope_denied"],
  ["global share scope not accepted", { grant: { ...grant(), scopes: ["family_group"] } }, "scope_denied"],
  ["replay consent lost for a recipient", { action: "view_replay", story: { ...source(), replayConsentActive: false } }, "replay_consent_inactive"],
]) {
  test("fail closed: " + name, () => denied(decide(overrides), reason));
}
test("explicit named replay grant allows only replay projection", () => {
  assert.deepEqual(decide({ action: "view_replay", grant: { ...grant(), scopes: ["view_replay"] } }),
    { allowed: true, reason: "named_grant" });
});
test("reject forged caller-supplied relationship or family group as access authority", () => {
  denied(decide({ actor: another(), relationship: "parent", group: "family" }), "grant_invalid");
});
