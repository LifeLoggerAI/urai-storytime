import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(entry)) continue;
      files.push(...walk(path));
      continue;
    }

    if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      files.push(path);
    }
  }

  return files;
}

const files = walk('src');

if (files.length === 0) {
  console.error('Provider wiring validation failed. No source files found under src/.');
  process.exit(1);
}

const matches = files
  .map((file) => ({ file, text: readFileSync(file, 'utf8') }))
  .filter(({ text }) =>
    text.includes('firebase') ||
    text.includes('initializeApp') ||
    text.includes('getAuth') ||
    text.includes('getFirestore') ||
    text.includes('firebase/auth') ||
    text.includes('firebase/firestore')
  );

if (matches.length === 0) {
  console.error('Provider wiring validation failed. No Firebase client/provider usage found under src/.');
  process.exit(1);
}

const combined = matches.map(({ text }) => text).join('\n');

const hasFirebaseApp =
  combined.includes('initializeApp') ||
  combined.includes('getApps') ||
  combined.includes('firebase/app');

const hasRuntimeProvider =
  combined.includes('getAuth') ||
  combined.includes('firebase/auth') ||
  combined.includes('getFirestore') ||
  combined.includes('firebase/firestore') ||
  combined.includes('firebase/storage');

if (!hasFirebaseApp || !hasRuntimeProvider) {
  console.error('Provider wiring validation failed. Firebase references exist, but app/runtime provider wiring is incomplete.');
  console.error(`Matched files: ${matches.map(({ file }) => file).join(', ')}`);
  process.exit(1);
}

console.log(`Provider wiring validated through: ${matches.map(({ file }) => file).join(', ')}`);
