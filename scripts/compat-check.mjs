import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'preview', 'test', 'test:smoke'];
const missingScripts = requiredScripts.filter((script) => !pkg.scripts?.[script]);

if (missingScripts.length) {
  console.error(`Missing required package scripts: ${missingScripts.join(', ')}`);
  process.exit(1);
}

const hasVanillaApp = fs.existsSync('src/app.js') && fs.existsSync('src/index.html');
const hasNextApp = fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs') || fs.existsSync('app/layout.tsx') || fs.existsSync('src/pages');

if (!hasVanillaApp && !hasNextApp) {
  console.error('Could not detect either the vanilla static app or a Next.js app structure.');
  process.exit(1);
}

if (hasNextApp) {
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) {
    console.error('Next.js app structure detected, but package.json does not declare next.');
    process.exit(1);
  }

  if (!pkg.dependencies?.react && !pkg.devDependencies?.react) {
    console.error('Next.js app structure detected, but package.json does not declare react.');
    process.exit(1);
  }

  if (!fs.existsSync('src/context/AuthContext.js') && !fs.existsSync('src/context/AuthContext.tsx')) {
    console.error('Next.js compatibility check failed: src/context/AuthContext.js or .tsx is required.');
    process.exit(1);
  }

  if (!pkg.dependencies?.autoprefixer && !pkg.devDependencies?.autoprefixer) {
    console.error('Next.js compatibility check failed: autoprefixer is required.');
    process.exit(1);
  }
}

console.log(`compat-check passed (${hasNextApp ? 'next-compatible' : 'vanilla-static'} mode)`);
