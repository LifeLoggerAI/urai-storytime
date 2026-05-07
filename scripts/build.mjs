import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('src');
const outputDir = path.resolve('dist');
const serverSource = path.resolve('scripts/server.mjs');
const serverOutput = path.join(outputDir, 'server.mjs');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });
await cp(serverSource, serverOutput);

console.log(`Build complete: ${outputDir}`);
