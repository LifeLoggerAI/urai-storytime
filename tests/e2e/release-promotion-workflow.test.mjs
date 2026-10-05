import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL(
  '../../.github/workflows/release-promotion.yml',
  import.meta.url,
);

const CHECKOUT_SHA = '3d3c42e5aac5ba805825da76410c181273ba90b1';
const SETUP_NODE_SHA = '820762786026740c76f36085b0efc47a31fe5020';
const UPLOAD_ARTIFACT_SHA = '043fb46d1a93c77aae656e7c1c64a875d1fc6a0a';

test('release-promotion verification remains exact-head, pinned, and non-deploying', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.match(workflow, new RegExp(`actions/checkout@${CHECKOUT_SHA}`));
  assert.match(workflow, new RegExp(`actions/setup-node@${SETUP_NODE_SHA}`));
  assert.match(workflow, new RegExp(`actions/upload-artifact@${UPLOAD_ARTIFACT_SHA}`));
  assert.doesNotMatch(workflow, /uses:\s+actions\/[\w-]+@v\d+/);

  assert.match(workflow, /TARGET_SHA:\s+\$\{\{ github\.sha \}\}/);
  assert.match(workflow, /ref:\s+\$\{\{ env\.TARGET_SHA \}\}/);
  assert.match(workflow, /persist-credentials:\s+false/);
  assert.match(workflow, /node-version:\s+'24'/);
  assert.match(workflow, /npm ci --no-audit/);
  assert.match(workflow, /npm --prefix functions ci --no-audit/);
  assert.match(workflow, /npm --prefix functions run build/);
  assert.match(workflow, /\[\[ "\$ROLLBACK_SHA" =~ \^\[0-9a-fA-F\]\{40\}\$ \]\]/);
  assert.match(workflow, /test "\$GITHUB_REF" = "refs\/heads\/main"/);
  assert.match(workflow, /git cat-file -e "\$\{ROLLBACK_SHA\}\^\{commit\}"/);
  assert.match(workflow, /git merge-base --is-ancestor "\$ROLLBACK_SHA" "\$TARGET_SHA"/);
  assert.match(workflow, /release-evidence\/deployments\/\$\{\{ inputs\.environment \}\}\/\$\{\{ inputs\.rollback_sha \}\}\.json/);
  assert.match(workflow, /urai-storytime-deployment-evidence-v1/);
  assert.match(workflow, /evidence\.smokeVerified !== true/);
  assert.match(workflow, /evidence\.rollbackTested !== true/);
  assert.match(workflow, /\.github\/workflows\/protected-deployment\.yml/);
  assert.match(workflow, /\.github\/workflows\/protected-rollback-drill\.yml/);
  assert.doesNotMatch(workflow, /trustedWorkflowPath[\s\S]*protected-rollback-test\.yml/);
  assert.match(workflow, /run\.event !== 'workflow_dispatch'/);
  assert.match(workflow, /retained\.digest !== artifactDigest/);
  assert.match(workflow, /deploymentArtifactDigest/);
  assert.match(workflow, /rollbackTestArtifactDigest/);
  assert.match(workflow, /Rollback evidence SHA-256/);
  assert.match(workflow, /Deployment performed by workflow: false/);
  assert.match(workflow, /Provider mutation performed by workflow: false/);

  assert.doesNotMatch(workflow, /firebase\s+deploy/);
  assert.doesNotMatch(workflow, /npm\s+run\s+deploy(?::|\s|$)/);
});
