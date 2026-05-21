import { execSync } from 'node:child_process';

function print(label, command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    console.log(`${label}: ${output || '(empty)'}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${label}: unavailable (${message})`);
  }
}

print('node', 'node --version');
print('npm', 'npm --version');
print('platform', 'node -p "process.platform + \" \" + process.arch"');
print('playwright', 'npx playwright --version');
console.log(`PLAYWRIGHT_BROWSERS_PATH: ${process.env.PLAYWRIGHT_BROWSERS_PATH || '(default)'}`);
console.log(`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: ${process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '(unset)'}`);
