import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const settings = {
  STORYTIME_GENERATION_PROVIDER: 'openai', OPENAI_API_KEY: 'offline-validator-fixture',
  STORYTIME_OPENAI_MODEL: 'offline-fixture', STORYTIME_PROVIDER_SPEND_AUTHORIZED: 'true',
  STORYTIME_OPENAI_INPUT_USD_PER_1M_TOKENS: '1', STORYTIME_OPENAI_OUTPUT_USD_PER_1M_TOKENS: '2',
  STORYTIME_MAX_GENERATION_COST_USD: '1', STORYTIME_PROVIDER_DAILY_BUDGET_USD: '10',
  STORYTIME_PROVIDER_USER_DAILY_BUDGET_USD: '2', STORYTIME_OPENAI_MAX_OUTPUT_TOKENS: '900'
};
// This invokes the source/config validator only. It never calls a provider.
for (const file of ['protected-deployment.yml', 'protected-rollback-drill.yml']) {
  test(`${file} passes governed configuration through to the actual provider validator`, () => {
    const workflow = readFileSync(`.github/workflows/${file}`, 'utf8');
    const block = workflow.split('- name: Validate protected release configuration')[1]?.split('run: npm run validate:release-promotion')[0];
    assert.ok(block, 'protected validation step must exist');
    const mapped = {};
    for (const [, key, source, setting] of block.matchAll(/^\s+(\w+): \$\{\{ (vars|secrets)\.(\w+) \}\}$/gm)) {
      if (key in settings) {
        assert.equal(setting, key);
        assert.equal(source, key === 'OPENAI_API_KEY' ? 'secrets' : 'vars');
        mapped[key] = settings[setting];
      }
    }
    assert.deepEqual(Object.keys(mapped).sort(), Object.keys(settings).sort());
    const result = spawnSync(process.execPath, ['scripts/validate-provider-wiring.mjs'], { env: { PATH: process.env.PATH, ...mapped }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const denied = spawnSync(process.execPath, ['scripts/validate-provider-wiring.mjs'], { env: { PATH: process.env.PATH, ...mapped, STORYTIME_PROVIDER_SPEND_AUTHORIZED: 'false' }, encoding: 'utf8' });
    assert.notEqual(denied.status, 0, 'passing configuration must not bypass spend authorization');
  });
}

test('archive owner/updatedAt query has its composite index without dropping createdAt index', () => {
  const indexes = JSON.parse(readFileSync('firestore.indexes.json', 'utf8')).indexes;
  for (const orderedField of ['createdAt', 'updatedAt']) {
    assert.ok(indexes.some(index => index.collectionGroup === 'storySessions' && index.queryScope === 'COLLECTION' &&
      JSON.stringify(index.fields) === JSON.stringify([{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: orderedField, order: 'DESCENDING' }])), orderedField);
  }
});
