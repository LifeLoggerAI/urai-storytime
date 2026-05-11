import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const distRoot = path.resolve(repoRoot, 'dist');
const srcRoot = path.resolve(repoRoot, 'src');
const root = scriptDir.endsWith(`${path.sep}dist`) ? distRoot : srcRoot;
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function safePath(url = '/') {
  const parsed = new URL(url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(parsed.pathname === '/' ? '/index.html' : parsed.pathname);
  const fp = path.resolve(root, `.${pathname}`);
  return fp.startsWith(root) ? fp : null;
}

http
  .createServer((req, res) => {
    const fp = safePath(req.url);
    if (!fp || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not found');
      return;
    }

    const ext = path.extname(fp);
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(fs.readFileSync(fp));
  })
  .listen(port, () => console.log(`URAI Storytime server: http://localhost:${port} serving ${root}`));
