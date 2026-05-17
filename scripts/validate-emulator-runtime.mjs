import fs from 'node:fs';

const blockers = [];

if (!fs.existsSync('firebase.emulators.json')) {
  blockers.push('firebase.emulators.json missing');
}

if (!fs.existsSync('firestore.rules')) {
  blockers.push('firestore.rules missing');
}

if (!fs.existsSync('storage.rules')) {
  blockers.push('storage.rules missing');
}

const emulatorProject = process.env.FIREBASE_EMULATOR_PROJECT || 'demo-urai-storytime';

console.log('Emulator runtime project:', emulatorProject);

if (blockers.length > 0) {
  console.error('Emulator runtime validation blockers:', blockers);
  process.exit(1);
}

console.log('Firebase emulator runtime scaffold validation passed.');
