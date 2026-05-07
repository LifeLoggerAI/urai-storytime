import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const ignored = new Set(['node_modules', 'dist', '.git']);
const files = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (/\.(js|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
}

function checkSyntax(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--check', file], { stdio: 'pipe' });
    let output = '';
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${file}\n${output}`));
    });
  });
}

await walk(process.cwd());
await Promise.all(files.map(checkSyntax));
console.log(`Syntax check passed for ${files.length} files.`);
