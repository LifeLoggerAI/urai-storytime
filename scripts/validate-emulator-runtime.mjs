import fs from 'node:fs';

const blockers = [];

if (!fs.existsSync('firebase.json')) blockers.push('firebase.json missing');
if (!fs.existsSync('firestore.rules')) blockers.push('firestore.rules missing');
if (!fs.existsSync('storage.rules')) blockers.push('storage.rules missing');

let emulatorConfig = null;
if (fs.existsSync('firebase.json')) {
  const parsed = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  emulatorConfig = parsed.emulators || null;
  if (!emulatorConfig) blockers.push('firebase.json missing emulators section');
}

const emulatorProject = process.env.FIREBASE_EMULATOR_PROJECT || 'demo-urai-storytime';
console.log('Emulator runtime project:', emulatorProject);

if (emulatorConfig) {
  for (const name of ['auth', 'functions', 'firestore', 'storage']) {
    if (!emulatorConfig[name] || !emulatorConfig[name].port) blockers.push('firebase.json missing port for emulator: ' + name);
  }
}

if (blockers.length > 0) {
  console.error('Emulator runtime validation blockers:');
  for (const blocker of blockers) console.error('- ' + blocker);
  process.exit(1);
}

console.log('Firebase emulator runtime scaffold validation passed.');
console.log('Behavioral emulator tests are still required before production.');
