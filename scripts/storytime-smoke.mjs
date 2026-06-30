import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = Number(process.env.STORYTIME_SMOKE_PORT || 3001);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const START_TIMEOUT_MS = 30000;
const REQUEST_TIMEOUT_MS = 10000;

const routes = [
  ['/', [200]],
  ['/create', [200]],
  ['/library', [200]],
  ['/privacy', [200]],
  ['/terms', [200]],
  ['/story/test-story', [200, 404]]
];

function request(path, expectedStatuses = [200]) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      const status = res.statusCode ?? 0;
      res.resume();

      if (!expectedStatuses.includes(status)) {
        reject(
          new Error(
            `GET ${path} returned ${status}; expected ${expectedStatuses.join(' or ')}`
          )
        );
        return;
      }

      console.log(`PASS GET ${path} -> ${status}`);
      resolve();
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`GET ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`));
    });

    req.on('error', reject);
  });
}

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < START_TIMEOUT_MS) {
    try {
      await request('/', [200]);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(`Server did not respond at ${BASE_URL} within ${START_TIMEOUT_MS}ms`);
}

async function main() {
  console.log(`Starting Next server on ${BASE_URL}`);

  const child = spawn('npm', ['run', 'start', '--', '-p', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32'
  });

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));

  const stop = () => {
    if (child.killed) return;

    if (process.platform === 'win32') {
      child.kill('SIGTERM');
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
  };

  try {
    await waitForServer();

    for (const [route, statuses] of routes) {
      await request(route, statuses);
    }

    console.log('Storytime smoke test passed.');
  } finally {
    stop();
  }
}

main().catch((error) => {
  console.error(`Storytime smoke test failed: ${error.message}`);
  process.exit(1);
});
