import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const commands = [];

function add(label, cmd, args, options = {}) {
  commands.push({ label, cmd, args, optional: Boolean(options.optional) });
}

function hasScript(scriptName, cwd = '.') {
  try {
    const packageJson = JSON.parse(await import('node:fs').then((fs) => fs.readFileSync(`${cwd}/package.json`, 'utf8')));
    return Boolean(packageJson.scripts?.[scriptName]);
  } catch {
    return false;
  }
}

if (existsSync('package.json')) {
  add('root typecheck', 'npm', ['run', 'typecheck', '--if-present']);
  add('root tests', 'npm', ['test', '--if-present']);
  add('root smoke test', 'npm', ['run', 'test:smoke', '--if-present']);
  add('env template validation', 'npm', ['run', 'test:env-template', '--if-present']);
  add('security rules static validation', 'npm', ['run', 'test:security-rules', '--if-present']);
  add('emulator scaffold validation', 'npm', ['run', 'test:emulator-scaffold', '--if-present']);
  add('emulator runtime validation', 'npm', ['run', 'test:emulator-runtime', '--if-present']);
  add('provider wiring validation', 'npm', ['run', 'test:provider-wiring', '--if-present']);
  add('production readiness scaffold validation', 'npm', ['run', 'test:production-readiness', '--if-present']);
  add('root build', 'npm', ['run', 'build', '--if-present']);
}

if (existsSync('functions/package.json')) {
  add('functions build', 'npm', ['--prefix', 'functions', 'run', 'build', '--if-present']);
}

let failed = false;
for (const { label, cmd, args } of commands) {
  console.log(`\n> ${label}: ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) failed = true;
}

if (!commands.length) console.log('No package.json found; nothing to verify.');
process.exit(failed ? 1 : 0);
