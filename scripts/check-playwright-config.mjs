import fs from 'node:fs';

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

console.log('Playwright config preflight passed.');
