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
    'emotionalArcSummaries',
    'publicStoryShares',
    'voiceoverJobs',
    'storyExports',
    'Required allow cases',
    'Required deny cases',
    'Client cannot read or write `storytimeUsageCounters`',
    'Public/signed-out users cannot read a revoked public share',
    'Storage paths must deny by default',
    'emulator-behavior.log',
    'no secrets',
    'no real personal data'
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
console.log('Behavioral emulator execution is still required before production readiness can be claimed.');
