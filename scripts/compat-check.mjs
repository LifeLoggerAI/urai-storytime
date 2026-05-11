import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'preview', 'test', 'test:smoke'];
const missingScripts = requiredScripts.filter((script) => !pkg.scripts?.[script]);

function fail(message) {
  console.error(`compat-check failed: ${message}`);
  process.exit(1);
}

if (missingScripts.length) {
  fail(`missing required package scripts: ${missingScripts.join(', ')}`);
}

const hasVanillaApp = fs.existsSync('src/app.js') && fs.existsSync('src/index.html');
const hasNextApp = fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs') || fs.existsSync('app/layout.tsx') || fs.existsSync('src/pages');

if (!hasVanillaApp && !hasNextApp) {
  fail('could not detect either the vanilla static app or a Next.js app structure.');
}

if (hasNextApp) {
  const hasNext = Boolean(pkg.dependencies?.next || pkg.devDependencies?.next);
  const hasReact = Boolean(pkg.dependencies?.react || pkg.devDependencies?.react);
  const hasReactDom = Boolean(pkg.dependencies?.['react-dom'] || pkg.devDependencies?.['react-dom']);
  const hasAuthContext = fs.existsSync('src/context/AuthContext.js') || fs.existsSync('src/context/AuthContext.jsx') || fs.existsSync('src/context/AuthContext.ts') || fs.existsSync('src/context/AuthContext.tsx');
  const hasAutoprefixer = Boolean(pkg.dependencies?.autoprefixer || pkg.devDependencies?.autoprefixer);
  const hasPostcss = Boolean(pkg.dependencies?.postcss || pkg.devDependencies?.postcss);
  const hasNextConfig = fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs');

  if (!hasNext) fail('Next.js app structure detected, but package.json does not declare next.');
  if (!hasReact) fail('Next.js app structure detected, but package.json does not declare react.');
  if (!hasReactDom) fail('Next.js app structure detected, but package.json does not declare react-dom.');
  if (!hasAuthContext) fail('Next.js app structure detected, but src/context/AuthContext.js/.jsx/.ts/.tsx is missing.');
  if (!hasAutoprefixer) fail('Next.js app structure detected, but autoprefixer is missing.');
  if (!hasPostcss) fail('Next.js app structure detected, but postcss is missing.');

  if (pkg.scripts?.build?.includes('next export') && !hasNextConfig) {
    fail('build script uses next export, but no next.config.js/mjs was found. Prefer output: export in next.config for modern Next.');
  }
}

console.log(`compat-check passed (${hasNextApp ? 'next-compatible' : 'vanilla-static'} mode)`);
