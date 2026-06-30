import { existsSync, readFileSync } from 'node:fs';

if (!existsSync('firebase.json')) {
  console.error('Emulator runtime validation failed. Missing firebase.json.');
  process.exit(1);
}

const firebaseConfig = JSON.parse(readFileSync('firebase.json', 'utf8'));
const emulators = firebaseConfig.emulators ?? {};
const required = ['auth', 'firestore', 'storage'];
const missing = required.filter((name) => !emulators[name]);

if (missing.length) {
  console.error(`Emulator runtime validation failed. Missing emulator config for: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Firebase emulator config validated for auth, firestore, and storage.');
