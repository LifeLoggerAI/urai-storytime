import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const require = createRequire(resolve(repoRoot, "functions/package.json"));
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getFamilyStoryView, grantFamilyStoryView, revokeFamilyStoryView } =
  await import(pathToFileURL(resolve(repoRoot, "functions/lib/family-story-sharing.js")).href);

const projectId = "demo-urai-family-r1586";
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("Both Firebase Auth and Firestore emulators required; never run against cloud.");
}
if (process.env.GCLOUD_PROJECT !== projectId || process.env.FIREBASE_CONFIG) {
  throw new Error("Use only exact isolated synthetic emulator project.");
}
process.env.STORYTIME_FAMILY_SHARING_ENABLED = "true"; // TEST PROCESS ONLY
if (!getApps().length) initializeApp({projectId});
const auth = getAuth(), db = getFirestore();

async function syntheticAccount(name) {
  const email = `synthetic-${name}-r1586@example.test`;
  const password = "SyntheticIsolatedPassword123!";
  const endpoint = "http://" + process.env.FIREBASE_AUTH_EMULATOR_HOST +
    "/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake";
  const signed = await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({email,password,returnSecureToken:true})});
  const response=await signed.json();
  assert.equal(signed.status,200,JSON.stringify({status:signed.status,error:response.error?.message}));
  await auth.updateUser(response.localId,{emailVerified:true});
  const login=await fetch("http://"+process.env.FIREBASE_AUTH_EMULATOR_HOST+
    "/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake",
    {method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({email,password,returnSecureToken:true})});
  const signin=await login.json();
  assert.equal(login.status,200,JSON.stringify({status:login.status,error:signin.error?.message}));
  const verified=await auth.verifyIdToken(signin.idToken,true);
  assert.equal(verified.uid,response.localId);
  assert.equal(verified.email_verified,true);
  return {uid:response.localId,idToken:signin.idToken};
}
function req(user,data) {
  return {auth:{uid:user.uid,token:{email_verified:true}},data,
    rawRequest:{get:(key)=>key.toLowerCase()==="authorization"?"Bearer "+user.idToken:undefined}};
}
async function rejects(fn,arg) {
  await assert.rejects(() => fn.run(arg));
}

test("auth-emulator-issued Grandma token allows one specific consented story to Mom only",async()=>{
  const grandma=await syntheticAccount("grandma"), mom=await syntheticAccount("mom"),
    outsider=await syntheticAccount("unrelated");
  const first="synthetic-grandma-only-one", second="synthetic-grandma-private-two";
  const version="synthetic-version-one", receiptId="synthetic-privacy-receipt-one";
  for(const [sessionId,title,chapterId] of [
    [first,"Synthetic grandma shared childhood story","synthetic-chapter-one"],
    [second,"Synthetic private family recording","synthetic-chapter-two"]
  ]) {
    await db.collection("storySessions").doc(sessionId).set({
      id:sessionId,userId:grandma.uid,title,status:"ready",safetyStatus:"approved",
      visibility:"private",deleted:false,retired:false,revoked:false,currentVersionId:version,
      chapterIds:[chapterId],consentSnapshot:{memoryUse:true,voiceover:false},
      provenance:{sourceType:"direct_storytime_input",factualStatus:"creative_derivative_not_source_evidence"}
    });
    await db.collection("storyChapters").doc(chapterId).set({
      id:chapterId,userId:grandma.uid,sessionId,summary:"Synthetic story summary for "+sessionId
    });
  }
  await db.collection("consentDecisionReceipts").doc(receiptId).set({
    schemaVersion:"storytime-consent-decision-receipt-v1",id:receiptId,
    userId:grandma.uid,sourceSessionId:first,recipientUid:mom.uid,
    sourceVersionId:version,shareEpoch:0,purpose:"storytime.family_share",
    policyVersion:"family-story-share-v1",decision:"authorized",revoked:false,
    issuedBy:"urai-privacy",expiresAt:Timestamp.fromMillis(Date.now()+86400000)
  }); // EMULATOR-SEEDED FAKE RECEIPT; NOT CANONICAL PRODUCTION PRIVACY
  const g=await grantFamilyStoryView.run(req(grandma,{
    sessionId:first,recipientUid:mom.uid,consentReceiptId:receiptId,expiresInDays:1
  }));
  assert.equal(g.granted,true);
  const view=await getFamilyStoryView.run(req(mom,{sessionId:first,ownerUid:grandma.uid}));
  assert.equal(view.title,"Synthetic grandma shared childhood story");
  assert.equal(view.summary,"Synthetic story summary for "+first);
  assert.deepEqual(Object.keys(view).sort(),["ownerUid","provenance","sessionId","summary","title"].sort());
  assert.ok(!JSON.stringify(view).includes("Synthetic private family recording"));
  await rejects(getFamilyStoryView,req(mom,{sessionId:second,ownerUid:grandma.uid}));
  await rejects(getFamilyStoryView,req(outsider,{sessionId:first,ownerUid:grandma.uid}));
  await rejects(grantFamilyStoryView,req(mom,{
    sessionId:second,recipientUid:outsider.uid,consentReceiptId:receiptId,expiresInDays:1
  }));
  await db.collection("consentDecisionReceipts").doc(receiptId).update({revoked:true});
  await rejects(getFamilyStoryView,req(mom,{sessionId:first,ownerUid:grandma.uid}));
  await db.collection("consentDecisionReceipts").doc(receiptId).update({revoked:false});
  assert.equal((await getFamilyStoryView.run(req(mom,{sessionId:first,ownerUid:grandma.uid}))).title,
    "Synthetic grandma shared childhood story");
  const revoked=await revokeFamilyStoryView.run(req(grandma,{sessionId:first,recipientUid:mom.uid}));
  assert.equal(revoked.revoked,true);
  await rejects(getFamilyStoryView,req(mom,{sessionId:first,ownerUid:grandma.uid}));
  await rejects(grantFamilyStoryView,req(grandma,{
    sessionId:first,recipientUid:mom.uid,consentReceiptId:receiptId,expiresInDays:1
  }));
});
