import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'package.json',
  'firebase.json',
  'next.config.mjs'
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length) {
  console.error(`Production readiness validation failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const requiredScripts = ['build', 'typecheck', 'test'];
const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);

if (missingScripts.length) {
  console.error(`Production readiness validation failed. Missing package scripts: ${missingScripts.join(', ')}`);
  process.exit(1);
}

const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

if (!deps.next || !deps.react || !deps.firebase) {
  console.error('Production readiness validation failed. Missing required Next/React/Firebase dependencies.');
  process.exit(1);
}

console.log('Production readiness scaffold validated.');
