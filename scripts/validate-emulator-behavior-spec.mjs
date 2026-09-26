import fs from 'node:fs';

const specPath = 'docs/STORYTIME_EMULATOR_BEHAVIOR_SPEC.md';
const failures = [];

if (!fs.existsSync(specPath)) {
  failures.push('Missing emulator behavior proof spec: ' + specPath);
} else {
  const spec = fs.readFileSync(specPath, 'utf8');
  for (const marker of [
    'ownerUser',
    'otherUser',
    'adminUser',
    'signedOut',
    'storySessions',
    'storyChapters',
    'storyMoments',
    'memoryScenes',
    'narratorScripts',
    'emotional arcs',
    'public-story-share-v2',
    'storytimeUsageCounters',
    'storyGenerationRequests',
    'storyArchiveSnapshots',
    'privacyDeletionPlans',
    'server-created',
    'Append-only analytics',
    'Family story assets',
    'Moderation storage is admin-only',
    'Every unspecified Storage path is denied by default',
    'including stacked PRs',
    'exact candidate SHA',
    'no production credentials',
    'no real personal data',
    'does **not** prove'
  ]) {
    if (!spec.includes(marker)) failures.push('Emulator behavior spec missing marker: ' + marker);
  }
}

if (failures.length > 0) {
  console.error('Emulator behavior spec validation failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Emulator behavior proof spec validation passed.');
console.log('Executable Firestore/Storage emulator evidence is required on the exact candidate SHA before runtime authorization claims.');
