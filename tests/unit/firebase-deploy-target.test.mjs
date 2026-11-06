import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  attestStorytimeTarget, parseDeployArgs, buildFirebaseDeployCommand,
  loadAndAttest, FirebaseTargetHold,
} from '../../scripts/guarded-firebase-deploy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const liveConfig = JSON.parse(fs.readFileSync(path.join(root, '.firebaserc'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const projectId = 'urai-storytime-68426933-5c896';
const env = { URAI_STORYTIME_FIREBASE_PROJECT_ID: projectId, STORYTIME_FIREBASE_ISOLATED: 'true' };
const valid = () => ({ projects: { default: projectId }, targets: { [projectId]: { hosting: { web: ['urai-storytime-staging'] } } } });

// The original immutable .firebaserc deliberately stays unresolved; never substitute a guessed project.
test('current Storytime .firebaserc remains HOLD even with matching env supplied', () =>
  assert.throws(() => attestStorytimeTarget(liveConfig, env), /placeholder/));
test('real source .firebaserc at project root remains HOLD', () =>
  assert.throws(() => loadAndAttest(root, env), /placeholder/));
test('explicit matching isolated Storytime binding passes identity check only', () =>
  assert.equal(attestStorytimeTarget(valid(), env), projectId));
test('missing explicit project environment fails closed', () =>
  assert.throws(() => attestStorytimeTarget(valid(), {}), /URAI_STORYTIME_FIREBASE_PROJECT_ID/));
test('isolation evidence missing fails closed', () =>
  assert.throws(() => attestStorytimeTarget(valid(), {URAI_STORYTIME_FIREBASE_PROJECT_ID:projectId}), /ISOLATED/));
test('false isolation flag fails closed', () =>
  assert.throws(() => attestStorytimeTarget(valid(), {...env, STORYTIME_FIREBASE_ISOLATED:'false'}), /ISOLATED/));
test('Firebase default mismatch fails closed', () => {
  const x=valid(); x.projects.default='urai-storytime-other';
  assert.throws(() => attestStorytimeTarget(x,env), /differs/);
});
test('core UrAi production cannot be selected', () => {
  const x=valid(); x.projects.default='urai-4dc1d';
  assert.throws(() => attestStorytimeTarget(x,{...env,URAI_STORYTIME_FIREBASE_PROJECT_ID:'urai-4dc1d'}), /another UrAi subsystem/);
});
test('a non-Storytime second alias is rejected', () => {
  const x=valid(); x.projects.core='urai-4dc1d';
  assert.throws(() => attestStorytimeTarget(x,env), /Unapproved Firebase alias/);
});
test('unexpected Hosting project key is rejected', () => {
  const x=valid();x.targets={'urai-4dc1d':{hosting:{web:['other-site']}}};
  assert.throws(() => attestStorytimeTarget(x,env), /Unbound Firebase target/);
});
test('placeholder inside hosting target is rejected', () => {
  const x=valid();x.targets[projectId].hosting.web=['REPLACE_WITH_HOSTING'];
  assert.throws(() => attestStorytimeTarget(x,env), /placeholder/);
});
test('invalid project identity is rejected', () => {
  const x=valid();x.projects.default='irai--$$';
  assert.throws(() => attestStorytimeTarget(x,{...env,URAI_STORYTIME_FIREBASE_PROJECT_ID:'irai--$$'}),FirebaseTargetHold);
});
test('invalid configuration structure is rejected', () =>
  assert.throws(() => attestStorytimeTarget({projects:[]},env), /invalid Firebase projects/));
test('additional flags and --project override are rejected', () => {
  assert.throws(() => parseDeployArgs(['--project','urai-4dc1d']), /override/);
  assert.throws(() => parseDeployArgs(['--only','functions','--project','urai-4dc1d']), /override/);
  assert.throws(() => parseDeployArgs(['--only','storage']), /override/);
});
test('fixed deployment scopes parsed without arbitrary CLI arguments', () => {
  assert.deepEqual(parseDeployArgs([]),{checkOnly:false,only:null});
  assert.deepEqual(parseDeployArgs(['--check-only']),{checkOnly:true,only:null});
  assert.equal(parseDeployArgs(['--only','functions']).only,'functions');
});
test('deployment command pins explicit project ID and safe scope', () => {
  assert.deepEqual(buildFirebaseDeployCommand(projectId,'functions','linux'),{command:'firebase',args:['deploy','--project',projectId,'--only','functions']});
});
test('Windows execution selects Firebase CMD shim', () =>
  assert.equal(buildFirebaseDeployCommand(projectId,null,'win32').command,'firebase.cmd'));
test('invalid selected deployment scope rejects', () =>
  assert.throws(() => buildFirebaseDeployCommand(projectId,'hosting,storage'), /Unapproved Firebase deploy scope/));
test('invalid selected project rejects', () =>
  assert.throws(() => buildFirebaseDeployCommand('urai-4dc1d',null), /Invalid pinned Storytime/));
for (const entry of ['deploy','deploy:rules','deploy:functions','deploy:hosting','deploy:staging','deploy:production']) {
  test(`npm script ${entry} uses guarded Firebase CLI`, () => {
    const command=pkg.scripts[entry];
    assert.ok(command?.includes('node scripts/guarded-firebase-deploy.mjs'),`missing guard from ${entry}`);
    assert.doesNotMatch(command,/\bfirebase deploy\b/,`raw Firebase bypass in ${entry}`);
  });
}
test('staging and production check project identity before any build',()=>{
  for(const name of ['deploy:staging','deploy:production']){
    const cmd=pkg.scripts[name];
    assert.ok(cmd.startsWith('npm run test:firebase-target && npm run build &&'),name);
  }
});
test('release preflight command is read-only --check-only mode',()=>
  assert.equal(pkg.scripts['test:firebase-target'],'node scripts/guarded-firebase-deploy.mjs --check-only'));
