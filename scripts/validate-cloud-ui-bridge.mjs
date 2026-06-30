import fs from 'node:fs';

const files = {
  createForm: 'src/components/StoryCreateForm.tsx',
  libraryPage: 'src/app/library/page.tsx',
  storyReplay: 'src/app/story/[storyId]/StoryReplayClient.tsx',
  cloudService: 'src/lib/cloudStoryService.ts'
};

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file required for cloud UI bridge validation: ${file}`);
  }
}

const createForm = fs.readFileSync(files.createForm, 'utf8');
const libraryPage = fs.readFileSync(files.libraryPage, 'utf8');
const storyReplay = fs.readFileSync(files.storyReplay, 'utf8');
const cloudService = fs.readFileSync(files.cloudService, 'utf8');

const checks = [
  ['cloud service exports createCloudStory', cloudService.includes('createCloudStory')],
  ['cloud service exports listCloudStories', cloudService.includes('listCloudStories')],
  ['cloud service exports getCloudStory', cloudService.includes('getCloudStory')],
  ['create form preserves local demo fallback', createForm.includes('createStoryManifest') && createForm.includes('saveLocalStory')],
  ['library preserves local demo fallback', libraryPage.includes('listLocalStories')],
  ['story replay preserves local demo fallback', storyReplay.includes('getLocalStory')]
];

const optionalBridgeChecks = [
  ['create form imports/uses cloud story creation', createForm.includes('createCloudStory')],
  ['library imports/uses cloud story listing', libraryPage.includes('listCloudStories')],
  ['story replay imports/uses cloud story loading', storyReplay.includes('getCloudStory')]
];

const failed = checks.filter(([, ok]) => !ok);

if (failed.length) {
  for (const [name] of failed) console.error(`FAIL ${name}`);
  throw new Error(`Cloud UI bridge base validation failed with ${failed.length} issue(s).`);
}

for (const [name] of checks) console.log(`PASS ${name}`);

const missingBridge = optionalBridgeChecks.filter(([, ok]) => !ok);

if (missingBridge.length) {
  for (const [name] of missingBridge) console.log(`PENDING ${name}`);
  console.log('Cloud UI bridge is not fully wired yet. Local Demo Mode remains the active fallback.');
} else {
  for (const [name] of optionalBridgeChecks) console.log(`PASS ${name}`);
  console.log('Cloud UI bridge appears wired at static validation level.');
}
