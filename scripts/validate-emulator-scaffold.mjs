import fs from 'node:fs';

const requiredFiles = [
  'firebase.emulators.json',
  'firestore.rules',
  'storage.rules',
  'tests/firestore-rules.test.mjs',
  'tests/storage-rules.test.mjs',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(file));

if (missing.length > 0) {
  console.error('Missing emulator scaffold files:', missing);
  process.exit(1);
}

console.log('Emulator scaffold validation passed.');
