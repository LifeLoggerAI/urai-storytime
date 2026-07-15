import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
const authority = fs.readFileSync('docs/CANONICAL_APP_ROOT.md', 'utf8');
const legacyReadme = fs.readFileSync('legacy/static-demo/README.md', 'utf8');

test('obsolete static Storytime entrypoints remain absent', () => {
  for (const file of ['src/index.html', 'src/app.js', 'src/styles.css']) {
    assert.equal(fs.existsSync(file), false, `${file} must not return to the active source tree`);
  }
});

test('Next.js and Firebase frameworks remain the only application authority', () => {
  assert.equal(packageJson.scripts.dev, 'next dev');
  assert.equal(packageJson.scripts.build, 'next build');
  assert.equal(packageJson.scripts.start, 'next start');
  assert.equal(firebaseJson.hosting.source, '.');
  assert.ok(firebaseJson.hosting.frameworksBackend, 'Firebase Hosting must use the Next.js frameworks backend');
  assert.equal(fs.existsSync('src/app'), true);
  assert.equal(fs.existsSync('src/components/storytime'), true);
  assert.equal(fs.existsSync('src/lib'), true);
  assert.equal(fs.existsSync('functions/src'), true);
});

test('no package script serves or deploys a static src directory', () => {
  const scripts = Object.entries(packageJson.scripts ?? {});
  for (const [name, command] of scripts) {
    assert.doesNotMatch(command, /(?:serve|http-server|firebase\s+deploy[^\n]*hosting)[^\n]*\bsrc\b/i, `${name} must not publish src as a static root`);
    assert.doesNotMatch(command, /src\/index\.html|src\/app\.js|src\/styles\.css/i, `${name} references a removed static entrypoint`);
  }
});

test('legacy documentation is non-runnable and canonical authority is explicit', () => {
  assert.match(authority, /only active URAI Storytime application is the Next\.js\/Firebase internal-alpha implementation/);
  assert.match(authority, /src\/index\.html/);
  assert.match(authority, /tests\/e2e\/canonical-app-root\.test\.mjs/);
  assert.match(legacyReadme, /documentation-only/);
  assert.match(legacyReadme, /must not contain an HTML entrypoint/);
  assert.equal(fs.existsSync('legacy/static-demo/index.html'), false);
  assert.equal(fs.existsSync('legacy/static-demo/package.json'), false);
});
