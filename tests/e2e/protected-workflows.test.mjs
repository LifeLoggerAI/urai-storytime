import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deploymentPath = new URL('../../.github/workflows/protected-deployment.yml', import.meta.url);
const rollbackSourcePath = new URL('../../.github/workflows/protected-rollback-test.yml', import.meta.url);
const promotionPath = new URL('../../.github/workflows/release-promotion.yml', import.meta.url);

test('protected deployment isolates untrusted verification from deploy identity', async () => {
  const workflow = await readFile(deploymentPath, 'utf8');

  assert.match(workflow, /verify:[\s\S]*permissions:\n\s+contents: read/);
  assert.match(workflow, /deploy:[\s\S]*needs: verify[\s\S]*id-token: write/);
  assert.match(workflow, /BASE_URL:\s+\$\{\{ vars\.URAI_STORYTIME_BASE_URL \}\}/);
  assert.match(workflow, /test "\$REQUESTED_BASE_URL" = "\$BASE_URL"/);

  const installIndex = workflow.indexOf('npm ci --no-audit');
  const authIndex = workflow.indexOf('Authenticate with short-lived Google WIF');
  const deployIndex = workflow.indexOf('./firebase-cli/node_modules/.bin/firebase deploy');
  assert.ok(installIndex >= 0 && installIndex < authIndex, 'dependency install must precede WIF authentication');
  assert.ok(authIndex < deployIndex, 'WIF authentication must be narrowly scoped to deployment');
  assert.ok(workflow.lastIndexOf('git status --porcelain') < authIndex, 'credential artifacts must not be included in a post-auth cleanliness check');

  for (const variable of [
    'URAI_STORYTIME_FIREBASE_PROJECT_ID',
    'URAI_STORYTIME_STAGING_TARGET',
    'URAI_STORYTIME_PRODUCTION_TARGET',
    'OPENAI_API_KEY',
    'URAI_LEGAL_APPROVED',
    'URAI_PRIVACY_APPROVED',
    'URAI_CHILD_SAFETY_APPROVED',
    'URAI_FIREBASE_AUTH_VERIFIED',
    'URAI_SMOKE_TEST_EVIDENCE_URL',
  ]) {
    assert.match(workflow, new RegExp(`\\b${variable}:\\s+\\$\\{\\{`));
  }

  assert.match(workflow, /sha256sum --check storytime-deploy-payload\.tgz\.sha256/);
  assert.match(workflow, /firebase\.deploy\.json/);
  assert.match(workflow, /delete entry\.predeploy/);
});

test('source verification cannot masquerade as an operational rollback drill', async () => {
  const [sourceWorkflow, promotionWorkflow] = await Promise.all([
    readFile(rollbackSourcePath, 'utf8'),
    readFile(promotionPath, 'utf8'),
  ]);

  assert.match(sourceWorkflow, /role: 'rollback-source-verification'/);
  assert.match(sourceWorkflow, /rollbackTested: false/);
  assert.match(sourceWorkflow, /operationalRollbackPerformed: false/);
  assert.doesNotMatch(sourceWorkflow, /role: 'rollback-test'/);

  assert.match(promotionWorkflow, /\.github\/workflows\/protected-rollback-drill\.yml/);
  assert.doesNotMatch(promotionWorkflow, /'\.github\/workflows\/protected-rollback-test\.yml'/);
});
