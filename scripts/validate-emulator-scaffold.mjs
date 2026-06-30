import fs from 'node:fs';

const failures = [];

function requireFile(file) {
  if (!fs.existsSync(file)) failures.push('Missing required file: ' + file);
}

requireFile('firebase.json');
requireFile('firestore.rules');
requireFile('storage.rules');
requireFile('tests/e2e/smoke.test.mjs');

if (fs.existsSync('firebase.json')) {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  const emulators = firebaseConfig.emulators || {};
  for (const name of ['auth', 'functions', 'firestore', 'storage', 'hosting', 'ui']) {
    if (!emulators[name]) failures.push('firebase.json missing emulator config for ' + name);
  }
  if (emulators.singleProjectMode !== true) failures.push('firebase.json emulator config should keep singleProjectMode true.');
}

if (failures.length > 0) {
  console.error('Emulator scaffold validation failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Emulator scaffold validation passed.');
console.log('firebase.json contains the required emulator config.');
