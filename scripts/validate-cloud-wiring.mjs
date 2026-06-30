import fs from 'node:fs';

const requiredFiles = [
  'src/lib/firebaseClient.ts',
  'src/lib/firebaseFunctions.ts',
  'src/lib/cloudStoryService.ts',
  'functions/src/index.ts'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required cloud wiring file: ${file}`);
  }
}

const firebaseFunctions = fs.readFileSync('src/lib/firebaseFunctions.ts', 'utf8');
const cloudStoryService = fs.readFileSync('src/lib/cloudStoryService.ts', 'utf8');
const functionsIndex = fs.readFileSync('functions/src/index.ts', 'utf8');

const checks = [
  ['firebaseFunctions uses getFunctions', firebaseFunctions.includes('getFunctions')],
  ['firebaseFunctions uses httpsCallable', firebaseFunctions.includes('httpsCallable')],
  ['firebaseFunctions calls generateStory', firebaseFunctions.includes("'generateStory'") || firebaseFunctions.includes('"generateStory"')],
  ['firebaseFunctions uses getFirebaseClientApp helper', firebaseFunctions.includes('getFirebaseClientApp')],
  ['cloudStoryService exports createCloudStory', cloudStoryService.includes('createCloudStory')],
  ['cloudStoryService exports listCloudStories', cloudStoryService.includes('listCloudStories')],
  ['cloudStoryService exports getCloudStory', cloudStoryService.includes('getCloudStory')],
  ['cloudStoryService queries stories collection', cloudStoryService.includes("'stories'") || cloudStoryService.includes('"stories"')],
  ['functions exports generateStory callable', functionsIndex.includes('export const generateStory')],
  ['functions persists stories collection', functionsIndex.includes("collection('stories')") || functionsIndex.includes('collection("stories")')],
  ['functions persists storyScenes collection', functionsIndex.includes("collection('storyScenes')") || functionsIndex.includes('collection("storyScenes")')]
];

const failed = checks.filter(([, ok]) => !ok);

if (failed.length) {
  for (const [name] of failed) console.error(`FAIL ${name}`);
  throw new Error(`Cloud wiring validation failed with ${failed.length} issue(s).`);
}

for (const [name] of checks) console.log(`PASS ${name}`);

console.log('Cloud wiring scaffold validated. UI auth/family end-to-end proof remains separate.');
