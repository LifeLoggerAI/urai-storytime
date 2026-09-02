import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = new URL(
  '../../.github/workflows/release-promotion.yml',
  import.meta.url,
);

const CHECKOUT_SHA = '11bd71901bbe5b1630ceea73d27597364c9af683';
const SETUP_NODE_SHA = '49933ea5288caeca8642d1e84afbd3f7d6820020';
const UPLOAD_ARTIFACT_SHA = 'ea165f8d65b6e75b540449e92b4886f43607fa02';

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
  assert.match(workflow, /Deployment performed by workflow: false/);
  assert.match(workflow, /Provider mutation performed by workflow: false/);

  assert.doesNotMatch(workflow, /firebase\s+deploy/);
  assert.doesNotMatch(workflow, /npm\s+run\s+deploy(?::|\s|$)/);
});
