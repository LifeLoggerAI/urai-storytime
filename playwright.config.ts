import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';

function resolveChromiumExecutablePath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }

  if (process.env.CI) {
    return undefined;
  }

  try {
    const path = execSync('command -v chromium', { encoding: 'utf8' }).trim();
    return path || undefined;
  } catch {
    return undefined;
  }
}

const chromiumExecutablePath = resolveChromiumExecutablePath();
const launchOptions = chromiumExecutablePath
  ? {
      executablePath: chromiumExecutablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-background-networking',
        '--disable-features=VizDisplayCompositor,UseChromeOSDirectVideoDecoder',
        '--single-process'
      ]
    }
  : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 900 },
    ...(launchOptions ? { launchOptions } : {})
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
