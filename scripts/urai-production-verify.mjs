import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const commands = [];

function add(label, cmd, args) {
  commands.push({ label, cmd, args });
}

if (existsSync('package.json')) {
  add('root typecheck', 'npm', ['run', 'typecheck', '--if-present']);
  add('root tests', 'npm', ['test', '--if-present']);
  add('root smoke test', 'npm', ['run', 'test:smoke', '--if-present']);
  add('env template validation', 'npm', ['run', 'test:env-template', '--if-present']);
  add('security rules validation', 'npm', ['run', 'test:security-rules', '--if-present']);
  add('emulator scaffold validation', 'npm', ['run', 'test:emulator-scaffold', '--if-present']);
  add('emulator runtime validation', 'npm', ['run', 'test:emulator-runtime', '--if-present']);
  add('provider wiring validation', 'npm', ['run', 'test:provider-wiring', '--if-present']);
  add('production readiness validation', 'npm', ['run', 'test:production-readiness', '--if-present']);
  add('root build', 'npm', ['run', 'build', '--if-present']);
}

if (existsSync('functions/package.json')) {
  add('functions build', 'npm', ['--prefix', 'functions', 'run', 'build', '--if-present']);
}

let failed = false;
for (const item of commands) {
  console.log('\n> ' + item.label + ': ' + item.cmd + ' ' + item.args.join(' '));
  const result = spawnSync(item.cmd, item.args, { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

if (!commands.length) console.log('No package.json found; nothing to verify.');
process.exit(failed ? 1 : 0);
