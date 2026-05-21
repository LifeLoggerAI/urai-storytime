import { execSync } from 'node:child_process';
import fs from 'node:fs';

function commandSucceeds(command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const configPath = 'playwright.config.ts';
const config = fs.readFileSync(configPath, 'utf8');
const blockedPatterns = [
  ['--single-process', 'Remove --single-process; it crashes Chromium in the local e2e environment.'],
  ['command -v chromium', 'Do not auto-select system Chromium; use Playwright-managed Chromium unless explicitly overridden.']
];

const failures = blockedPatterns.filter(([pattern]) => config.includes(pattern));

if (failures.length > 0) {
  console.error('Playwright config preflight failed:');
  for (const [pattern, message] of failures) {
    console.error(`- Found ${pattern}: ${message}`);
  }
  process.exit(1);
}

const skipRuntimeCheck = process.env.URAI_SKIP_PLAYWRIGHT_RUNTIME_CHECK === 'true';
const hasLinuxGlib =
  process.platform !== 'linux' ||
  commandSucceeds('ldconfig -p | grep -q libglib-2.0.so.0') ||
  Boolean(process.env.LD_LIBRARY_PATH?.includes('glib')) ||
  Boolean(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH);

if (!skipRuntimeCheck && !hasLinuxGlib) {
  console.error('Playwright environment preflight failed: missing libglib-2.0.so.0.');
  console.error('Chromium cannot launch until browser runtime libraries are available.');
  console.error('In IDX/Nix, pull latest and rebuild/restart the workspace so .idx/dev.nix reloads.');
  console.error('In a normal Ubuntu shell, install Playwright system dependencies with root access or use npm run test:e2e:install-with-deps.');
  process.exit(1);
}

console.log(skipRuntimeCheck ? 'Playwright config preflight passed; runtime library check skipped.' : 'Playwright config preflight passed.');