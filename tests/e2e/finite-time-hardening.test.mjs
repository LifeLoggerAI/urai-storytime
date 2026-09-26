import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const authorization = fs.readFileSync("src/lib/finite-time/final-render-approval.ts", "utf8");
const registry = fs.readFileSync("functions/src/finite-time-registry.ts", "utf8");

test("retention approval binds policy text and provider/model identity to SHA-256", () => {
  for (const marker of [
    'finiteTimeRetentionPolicySha256',
    'provider: provider.provider',
    'model: provider.model',
    'modelVersion: provider.modelVersion',
    'retentionPolicy: provider.retentionPolicy',
    'retentionPolicyReference: provider.retentionPolicyReference',
    'provider-retention-policy-hash-mismatch'
  ]) {
    assert.ok(authorization.includes(marker), `Missing retention binding: ${marker}`);
  }
});

test("stored animatic readiness rejects stale canon and unapproved shots", () => {
  for (const marker of [
    'canonRevision: z.string().min(1).max(80)',
    'canon.data.sourceAuthority.revision !== graph.data.canonRevision',
    'Stored shot graph does not match the exact canon revision.',
    'shot.reviewState !== "approved-for-animatic"',
    'is not approved for animatic.'
  ]) {
    assert.ok(registry.includes(marker), `Missing readiness boundary: ${marker}`);
  }
});
