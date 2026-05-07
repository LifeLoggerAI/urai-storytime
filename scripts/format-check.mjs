import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ignored = new Set(['node_modules', 'dist', '.git']);
const allowed = new Set(['.js', '.mjs', '.json', '.html', '.css', '.md', '.yml', '.yaml', '.svg', '.example', '']);
const failures = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!allowed.has(ext) && entry.name !== '.gitignore' && entry.name !== '.env.example') continue;
    const content = await readFile(fullPath, 'utf8');
    if (/\r\n/.test(content)) failures.push(`${fullPath}: use LF line endings`);
    if (content.length > 0 && !content.endsWith('\n')) failures.push(`${fullPath}: missing trailing newline`);
    content.split('\n').forEach((line, index) => {
      if (/[ \t]+$/.test(line)) failures.push(`${fullPath}:${index + 1}: trailing whitespace`);
    });
  }
}

await walk(process.cwd());

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Format check passed.');
