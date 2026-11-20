import { before, after, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails, assertSucceeds, initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, getBytes, uploadString } from 'firebase/storage';

let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'urai-storytime-family-private-review',
    firestore: { rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8') },
    storage: { rules: await readFile(new URL('../../storage.rules', import.meta.url), 'utf8') },
  });
});
beforeEach(async () => { await environment.clearFirestore(); await environment.clearStorage(); });
after(async () => { if (environment) await environment.cleanup(); });

async function adminSeedFirestore(path, value) {
  await environment.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(), path), value));
}
async function adminSeedStorage(path, value) {
  await environment.withSecurityRulesDisabled(async ctx => uploadString(ref(ctx.storage(), path), value));
}
test('synthetic Grandma shares one story with Mom: all underlying private sessions are still owner-only', async () => {
  await adminSeedFirestore('storySessions/grandma-one', { userId:'syntheticGrandma', title:'Shared memory', safetyStatus:'approved' });
  await adminSeedFirestore('storySessions/grandma-two', { userId:'syntheticGrandma', title:'Other recording' });
  await adminSeedFirestore('familyStoryViewGrants/grant-one', { sessionId:'grandma-one', ownerUid:'syntheticGrandma', recipientUid:'syntheticMom' });
  await adminSeedFirestore('familyStorySharingStates/grandma-one', { shareEpoch:0 });
  await adminSeedFirestore('consentDecisionReceipts/consent-one', { issuedBy:'urai-privacy', decision:'authorized' });
  const grandma = environment.authenticatedContext('syntheticGrandma').firestore();
  const mom = environment.authenticatedContext('syntheticMom', { familyIds:['family-a'] }).firestore();
  const outsider = environment.authenticatedContext('syntheticOutsider', { familyIds:['family-a'] }).firestore();
  const visitor = environment.unauthenticatedContext().firestore();
  for (const path of ['storySessions/grandma-one', 'storySessions/grandma-two']) {
    await assertSucceeds(getDoc(doc(grandma,path)));
    for(const actor of [mom,outsider,visitor]) await assertFails(getDoc(doc(actor,path)));
  }
  for (const path of ['familyStoryViewGrants/grant-one', 'familyStorySharingStates/grandma-one','consentDecisionReceipts/consent-one']) {
    for(const actor of [grandma,mom,outsider,visitor]) {
      await assertFails(getDoc(doc(actor,path)));
      await assertFails(setDoc(doc(actor,path), { status:'active' }));
      await assertFails(updateDoc(doc(actor,path), { decision:'authorized' }));
    }
  }
});
test('synthetic Grandma family membership does not reveal Mom-only or sister media', async () => {
  const paths = [
    'families/family-a/stories/grandma-one/shared-memory.jpg',
    'families/family-a/stories/grandma-two/private-recording.wav',
    'families/family-a/stories/grandma-two/private-photo.png',
    'families/family-a/exports/private-export.json',
  ];
  for(const path of paths) await adminSeedStorage(path,'synthetic fixture only');
  const grandma = environment.authenticatedContext('syntheticGrandma', { familyIds:['family-a'] }).storage();
  const mom = environment.authenticatedContext('syntheticMom', { familyIds:['family-a'] }).storage();
  const outsider = environment.authenticatedContext('syntheticOutsider', { familyIds:['family-b'] }).storage();
  const privileged = environment.authenticatedContext('syntheticAdmin', { admin:true }).storage();
  for(const actor of [grandma,mom,outsider,privileged,environment.unauthenticatedContext().storage()]) {
    for (const path of paths) {
      await assertFails(getBytes(ref(actor,path)));
      await assertFails(uploadString(ref(actor,path),'forged media overwrite'));
    }
  }
});
