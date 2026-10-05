import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const command = (bin,args=[]) => execFileSync(bin,args,{encoding:'utf8'}).trim();
const targetSha = process.env.TARGET_SHA || process.env.GITHUB_SHA || '';
if (!/^[0-9a-f]{40}$/.test(targetSha)) throw new Error('exact TARGET_SHA is required');
const head = command('git',['rev-parse','HEAD']);
if (head !== targetSha) throw new Error('checkout does not match TARGET_SHA');

const commands = [
  'npm ci --no-audit',
  'npm run lint',
  'npm run typecheck',
  'npm test',
  'npm run test:smoke',
  'npm run test:deployment',
  'npm run test:security-rules',
  'npm run test:emulator-scaffold',
  'npm run test:emulator-runtime',
  'npm run test:production-readiness',
  'npm run build',
  'npm --prefix functions ci --no-audit',
  'npm --prefix functions run build',
];

const receipt = {
  schemaVersion:'urai-storytime-ci-reproducibility-v1',
  repository:process.env.GITHUB_REPOSITORY || 'LifeLoggerAI/urai-storytime',
  exactSha:targetSha,
  workflow:process.env.GITHUB_WORKFLOW || null,
  workflowRunId:process.env.GITHUB_RUN_ID || null,
  workflowRunAttempt:process.env.GITHUB_RUN_ATTEMPT || null,
  event:process.env.GITHUB_EVENT_NAME || null,
  nodeVersion:command('node',['--version']),
  npmVersion:command('npm',['--version']),
  lockfiles:{
    root:{path:'package-lock.json',sha256:sha256('package-lock.json')},
    functions:{path:'functions/package-lock.json',sha256:sha256('functions/package-lock.json')},
  },
  commands,
  sourceChecks:{
    rootStatusPath:'/tmp/storytime-root/status.txt',
    expectedRootStatus:'0',
    functionsBuildOwnedBySiblingJob:true,
  },
  requiredCheckEvidence:{
    observedRepositoryRulesets:[],
    branchProtectionReadback:'not-readable-by-installed-github-app-admin-scope',
    note:'No repository rulesets were returned by the connected read-only rulesets endpoint. Branch-protection REST readback returned 403 Resource not accessible by integration; this receipt does not infer protection state.',
  },
  productionEvidenceBoundary:'Production-only evidence gates remain separate and fail closed on main when provider/Firebase/legal/safety receipts are absent.',
  secretValuesIncluded:false,
};
const out = process.env.STORYTIME_REPRO_RECEIPT || '/tmp/storytime-root/storytime-reproducibility.json';
mkdirSync(path.dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
