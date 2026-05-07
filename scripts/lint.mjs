import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ignored = new Set(['node_modules', 'dist', '.git']);
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
    if (!/\.(js|mjs|html)$/.test(entry.name)) continue;
    const content = await readFile(fullPath, 'utf8');
    if (/\.innerHTML\s*=/.test(content)) failures.push(`${fullPath}: avoid assigning innerHTML; build DOM nodes safely`);
    if (/\bwindow\s*\.\s*alert\s*\(|\bglobalThis\s*\.\s*alert\s*\(/.test(content)) failures.push(`${fullPath}: avoid blocking browser dialogs; use inline status messaging`);
    if (/console\.log\([^`'"\n]*secret/i.test(content)) failures.push(`${fullPath}: possible secret logging`);
  }
}

await walk(process.cwd());

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Static lint passed.');
