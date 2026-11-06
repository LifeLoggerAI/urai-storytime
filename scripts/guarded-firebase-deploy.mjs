#!/usr/bin/env node
/**
 * Storytime Firebase target identity preflight for existing npm deploy scripts.
 * Read-only until the final, explicitly requested Firebase CLI invocation.
 * This is NOT a founder release decision, provider readiness receipt, or CI approval.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowedOnly = new Set([
  'firestore:rules,firestore:indexes',
  'functions',
  'hosting',
  'firestore:rules,firestore:indexes,functions,hosting',
]);
const firebaseProjectId = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const placeholder = /(?:REPLACE_WITH_|PLACEHOLDER|CHANGE_ME|YOUR_PROJECT_ID|<project)/i;

export class FirebaseTargetHold extends Error {
  constructor(message) { super(message); this.name = 'FirebaseTargetHold'; }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function attestStorytimeTarget(firebaseRc, env = {}) {
  if (!isRecord(firebaseRc) || !isRecord(firebaseRc.projects)) {
    throw new FirebaseTargetHold('Missing or invalid Firebase projects configuration');
  }
  if (placeholder.test(JSON.stringify(firebaseRc))) {
    throw new FirebaseTargetHold('Unresolved placeholder in .firebaserc; deployment prohibited');
  }
  const configured = env.URAI_STORYTIME_FIREBASE_PROJECT_ID;
  if (typeof configured !== 'string' || !firebaseProjectId.test(configured)) {
    throw new FirebaseTargetHold('Explicit valid URAI_STORYTIME_FIREBASE_PROJECT_ID is required');
  }
  if (!configured.startsWith('urai-storytime')) {
    throw new FirebaseTargetHold('Storytime deployment cannot target another UrAi subsystem');
  }
  if (env.STORYTIME_FIREBASE_ISOLATED !== 'true') {
    throw new FirebaseTargetHold('STORYTIME_FIREBASE_ISOLATED=true required; no shared Firebase admission');
  }
  if (firebaseRc.projects.default !== configured) {
    throw new FirebaseTargetHold('Firebase default project differs from the explicitly configured Storytime project');
  }
  for (const [alias, id] of Object.entries(firebaseRc.projects)) {
    if (typeof id !== 'string' || !firebaseProjectId.test(id) || !id.startsWith('urai-storytime')) {
      throw new FirebaseTargetHold(`Unapproved Firebase alias target for ${alias}`);
    }
    if (id !== configured) {
      throw new FirebaseTargetHold(`Firebase alias ${alias} must use the exact configured Storytime project`);
    }
  }
  if (firebaseRc.targets !== undefined) {
    if (!isRecord(firebaseRc.targets)) {
      throw new FirebaseTargetHold('Invalid Firebase targets configuration');
    }
    const approved = new Set(Object.values(firebaseRc.projects));
    for (const [targetId, data] of Object.entries(firebaseRc.targets)) {
      if (!approved.has(targetId) || !isRecord(data)) {
        throw new FirebaseTargetHold(`Unbound Firebase target for ${targetId}`);
      }
      // Firebase target aliases select Hosting sites *inside* the project. The
      // project match alone is not sufficient to approve another site's identity.
      if (Object.keys(data).length !== 1 || !isRecord(data.hosting)
        || Object.keys(data.hosting).length === 0) {
        throw new FirebaseTargetHold(`Invalid Storytime Hosting target configuration for ${targetId}`);
      }
      for (const [targetName, sites] of Object.entries(data.hosting)) {
        if (!/^[a-z][a-z0-9-]{0,62}$/.test(targetName) || !Array.isArray(sites)
          || sites.length === 0 || new Set(sites).size !== sites.length
          || sites.some(site => typeof site !== 'string' || !/^urai-storytime-[a-z0-9][a-z0-9-]{0,62}$/.test(site))) {
          throw new FirebaseTargetHold(`Invalid Storytime Hosting target ${targetName}`);
        }
      }
    }
  }
  return configured;
}

export function parseDeployArgs(args = []) {
  if (args.length === 1 && args[0] === '--check-only') return { checkOnly: true, only: null };
  if (args.length === 0) return { checkOnly: false, only: null };
  if (args.length === 2 && args[0] === '--only' && allowedOnly.has(args[1])) {
    return { checkOnly: false, only: args[1] };
  }
  throw new FirebaseTargetHold('Unrecognized deploy flags or target override; only exact package-controlled targets are supported');
}

export function buildFirebaseDeployCommand(projectId, only = null, platform = process.platform) {
  if (!firebaseProjectId.test(projectId) || !projectId.startsWith('urai-storytime')) {
    throw new FirebaseTargetHold('Invalid pinned Storytime deployment target');
  }
  if (only !== null && !allowedOnly.has(only)) {
    throw new FirebaseTargetHold('Unapproved Firebase deploy scope');
  }
  return {
    command: platform === 'win32' ? 'firebase.cmd' : 'firebase',
    args: ['deploy', '--project', projectId, ...(only ? ['--only', only] : [])],
  };
}

export function loadAndAttest(rootDir = root, env = process.env) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(path.join(rootDir, '.firebaserc'), 'utf8'));
  } catch (error) {
    throw new FirebaseTargetHold(`Cannot read valid .firebaserc: ${error.message}`);
  }
  return attestStorytimeTarget(config, env);
}

function main() {
  const { only, checkOnly } = parseDeployArgs(process.argv.slice(2));
  const projectId = loadAndAttest();
  const run = buildFirebaseDeployCommand(projectId, only);
  if (checkOnly) {
    console.log(`Source Firebase project binding verified: ${projectId}; NOT release-approved; no deployment executed`);
    return;
  }
  console.error(`Firebase deployment target pinned: ${projectId}; this does not replace independent release authorization`);
  const result = spawnSync(run.command, run.args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.error) throw new FirebaseTargetHold(`Firebase CLI invocation failed: ${result.error.message}`);
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { console.error(`GENESIS HOLD: ${error.message}`); process.exitCode = 1; }
}
