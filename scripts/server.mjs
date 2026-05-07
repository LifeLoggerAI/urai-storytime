import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8']
]);

export function resolveRoot(rootArg = process.argv[2] || 'src') {
  return path.resolve(rootArg);
}

export function safeResolve(root, requestUrl = '/') {
  if (/%2e/i.test(requestUrl) || requestUrl.includes('..')) {
    return null;
  }

  const url = new URL(requestUrl, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  return resolved;
}

async function sendFile(root, req, res) {
  const filePath = safeResolve(root, req.url);

  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  try {
    const details = await stat(filePath);

    if (!details.isFile()) {
      throw new Error('Not a file');
    }

    const body = await readFile(filePath);
    const type = MIME_TYPES.get(path.extname(filePath)) || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

export function createServer({ root = resolveRoot() } = {}) {
  const resolvedRoot = path.resolve(root);
  return http.createServer((req, res) => {
    sendFile(resolvedRoot, req, res).catch(() => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
    });
  });
}

export function startServer({ root = resolveRoot(), port = Number(process.env.PORT || 4173) } = {}) {
  const server = createServer({ root });
  server.listen(port, () => {
    console.log(`URAI Storytime serving ${path.resolve(root)} at http://localhost:${port}`);
  });
  return server;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  startServer();
}
