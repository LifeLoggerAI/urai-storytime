import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync('functions/src/storytime-narrator-recovery-authority.ts', 'utf8');
const { canRunStorytimeNarratorRecovery } = await import(
  'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64')
);
const authorized = () => ({
  URAI_STORYTIME_NARRATOR_RECOVERY_ENABLED:'true',
  URAI_STORYTIME_NARRATOR_RECOVERY_TEST_ONLY:'true',
  STORYTIME_FIREBASE_ISOLATED:'true',
  GCLOUD_PROJECT:'urai-storytime-test',
  URAI_STORYTIME_NARRATOR_RECOVERY_PROJECT_ID:'urai-storytime-test',
  URAI_STORYTIME_FIREBASE_PROJECT_ID:'urai-storytime-test',
  URAI_STORYTIME_STAGING_TARGET:'urai-storytime-test',
  URAI_STORYTIME_PRODUCTION_TARGET:'urai-storytime-prod',
  URAI_CORE_FIREBASE_PROJECT_ID:'urai-4dc1d',
  URAI_ANALYTICS_FIREBASE_PROJECT_ID:'urai-analytics-prod',
});
test('recovery remains disabled without every explicit staging authority', () => {
  assert.equal(canRunStorytimeNarratorRecovery({}),false);
  const good=authorized();
  assert.equal(canRunStorytimeNarratorRecovery(good),true);
  for (const field of ['URAI_STORYTIME_NARRATOR_RECOVERY_ENABLED',
    'URAI_STORYTIME_NARRATOR_RECOVERY_TEST_ONLY','STORYTIME_FIREBASE_ISOLATED',
    'GCLOUD_PROJECT','URAI_STORYTIME_NARRATOR_RECOVERY_PROJECT_ID',
    'URAI_STORYTIME_FIREBASE_PROJECT_ID','URAI_STORYTIME_STAGING_TARGET',
    'URAI_STORYTIME_PRODUCTION_TARGET']) {
    const env={...good};delete env[field];
    assert.equal(canRunStorytimeNarratorRecovery(env),false,field+' missing must deny');
  }
});
test('mismatched, production or shared environments cannot activate scheduler', () => {
  const good=authorized();
  for (const changed of [
    {GCLOUD_PROJECT:'urai-storytime-other'},
    {GCP_PROJECT:'different-project'},
    {URAI_STORYTIME_NARRATOR_RECOVERY_PROJECT_ID:'urai-4dc1d'},
    {URAI_STORYTIME_PRODUCTION_TARGET:'urai-storytime-test'},
    {URAI_STORYTIME_FIREBASE_PROJECT_ID:'urai-storytime-prod'},
    {URAI_STORYTIME_STAGING_TARGET:'urai-staging'},
    {URAI_CORE_FIREBASE_PROJECT_ID:'urai-storytime-test'},
    {URAI_ANALYTICS_FIREBASE_PROJECT_ID:'urai-storytime-test'},
    {URAI_STORYTIME_NARRATOR_RECOVERY_TEST_ONLY:'false'},
    {URAI_STORYTIME_NARRATOR_RECOVERY_ENABLED:'false'}
  ]) assert.equal(canRunStorytimeNarratorRecovery({...good,...changed}),false,JSON.stringify(changed));
});
