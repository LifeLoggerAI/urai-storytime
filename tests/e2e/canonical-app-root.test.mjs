import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const resolvePath = (relativePath) => path.join(rootDir, relativePath);
const packageJson = JSON.parse(fs.readFileSync(resolvePath('package.json'), 'utf8'));
const firebaseJson = JSON.parse(fs.readFileSync(resolvePath('firebase.json'), 'utf8'));
const authority = fs.readFileSync(resolvePath('docs/CANONICAL_APP_ROOT.md'), 'utf8');
const legacyReadme = fs.readFileSync(resolvePath('legacy/static-demo/README.md'), 'utf8');

function sourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return [absolute];
  });
}

test('obsolete static Storytime entrypoints remain absent from canonical source', () => {
  for (const file of ['src/index.html', 'src/app.js', 'src/styles.css', 'src/story-engine.mjs']) {
    assert.equal(fs.existsSync(resolvePath(file)), false, `${file} must not return to the active source tree`);
  }
  assert.equal(fs.existsSync(resolvePath('legacy/static-demo/story-engine.mjs')), true);
});

test('Next.js and Firebase frameworks remain the only application authority', () => {
  assert.equal(packageJson.scripts.dev, 'next dev');
  assert.equal(packageJson.scripts.build, 'next build');
  assert.equal(packageJson.scripts.start, 'next start');
  assert.equal(firebaseJson.hosting.source, '.');
  assert.ok(firebaseJson.hosting.frameworksBackend, 'Firebase Hosting must use the Next.js frameworks backend');
  assert.equal(fs.existsSync(resolvePath('src/app')), true);
  assert.equal(fs.existsSync(resolvePath('src/components/storytime')), true);
  assert.equal(fs.existsSync(resolvePath('src/lib')), true);
  assert.equal(fs.existsSync(resolvePath('functions/src')), true);
});

test('no package script serves, deploys, or references the static legacy implementation', () => {
  const scripts = Object.entries(packageJson.scripts ?? {});
  for (const [name, command] of scripts) {
    assert.doesNotMatch(command, /(?:serve|http-server|firebase\s+deploy[^\n]*hosting)[^\n]*\bsrc\b/i, `${name} must not publish src as a static root`);
    assert.doesNotMatch(command, /src\/index\.html|src\/app\.js|src\/styles\.css|src\/story-engine\.mjs|legacy\/static-demo/i, `${name} references a legacy runtime`);
  }
});

test('production source cannot import the archived static demo', () => {
  const productionFiles = [
    ...sourceFiles(resolvePath('src/app')),
    ...sourceFiles(resolvePath('src/components')),
    ...sourceFiles(resolvePath('src/lib')),
    ...sourceFiles(resolvePath('functions/src'))
  ].filter((file) => /\.(?:[cm]?[jt]sx?|mjs)$/.test(file));

  for (const file of productionFiles) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /legacy\/static-demo|story-engine\.mjs/, `${path.relative(rootDir, file)} imports legacy Storytime code`);
  }
});

test('legacy archive is explicitly non-canonical and non-deployable', () => {
  assert.match(authority, /only active URAI Storytime application is the Next\.js\/Firebase internal-alpha implementation/);
  assert.match(authority, /legacy\/static-demo\/story-engine\.mjs/);
  assert.match(authority, /production source and Functions do not import from/);
  assert.match(legacyReadme, /not a production or launch runtime/i);
  assert.match(legacyReadme, /must not be imported by production application code/i);
  assert.equal(fs.existsSync(resolvePath('legacy/static-demo/index.html')), false);
  assert.equal(fs.existsSync(resolvePath('legacy/static-demo/package.json')), false);
});
