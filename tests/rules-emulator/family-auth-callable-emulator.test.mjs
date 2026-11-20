import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const require = createRequire(resolve(repoRoot, "functions/package.json"));
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { canonicalFamilyPrivacyReceiptBytes } =
  await import(pathToFileURL(resolve(repoRoot, "functions/lib/family-privacy-receipt-signature.js")).href);
const { getFamilyStoryView, grantFamilyStoryView, revokeFamilyStoryView } =
  await import(pathToFileURL(resolve(repoRoot, "functions/lib/family-story-sharing.js")).href);

const projectId = "demo-urai-family-r1586";
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("Both Firebase Auth and Firestore emulators required; never run against cloud.");
}
// Firebase CLI injects FIREBASE_CONFIG for emulator executions. Validate its
// project identity rather than rejecting the legitimate injected configuration.
let firebaseConfig = {};
try {
  firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
} catch {
  throw new Error("Firebase emulator config must be valid JSON.");
}
if ((process.env.GCLOUD_PROJECT !== projectId && process.env.GOOGLE_CLOUD_PROJECT !== projectId)
    || (firebaseConfig.projectId && firebaseConfig.projectId !== projectId)
    || !/^127[.]0[.]0[.]1:[0-9]+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST)
    || !/^127[.]0[.]0[.]1:[0-9]+$/.test(process.env.FIRESTORE_EMULATOR_HOST)) {
  throw new Error("Use only the exact isolated localhost synthetic Firebase emulator project.");
}
process.env.STORYTIME_FAMILY_SHARING_ENABLED = "true"; // TEST PROCESS ONLY
// Keys are ephemeral and synthetic; only the public verifier is in Functions.
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
process.env.STORYTIME_FAMILY_PRIVACY_ED25519_KEY_ID = "synthetic-test-key-r1586";
process.env.STORYTIME_FAMILY_PRIVACY_ED25519_PUBLIC_KEY_SPKI_B64 =
  publicKey.export({ format:"der", type:"spki" }).toString("base64");
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
  const summary = "Synthetic story summary for "+first;
  const approvedProjectionSha256 = createHash("sha256").update(JSON.stringify({
    sourceSystem:"urai-storytime", ownerUid:grandma.uid, sessionId:first, versionId:version,
    title:"Synthetic grandma shared childhood story", summary
  })).digest("hex");
  const expiresAtMs = Date.now()+86400000;
  const signedFields = {
    schemaVersion:"storytime-consent-decision-receipt-v1",id:receiptId,
    userId:grandma.uid,sourceSessionId:first,recipientUid:mom.uid,
    sourceVersionId:version,shareEpoch:0,purpose:"storytime.family_share",
    policyVersion:"family-story-share-v1",decision:"authorized",
    issuedBy:"urai-privacy",approvedProjectionSha256,expiresAtMs,
  };
  const receipt = {
    ...signedFields,revoked:false,expiresAt:Timestamp.fromMillis(expiresAtMs),
    issuerKeyId:"synthetic-test-key-r1586",
    issuerSignature:sign(null,canonicalFamilyPrivacyReceiptBytes(signedFields),privateKey).toString("base64url"),
  };
  delete receipt.expiresAtMs; // Firestore Timestamp is the only expiry source.
  await db.collection("consentDecisionReceipts").doc(receiptId).set(receipt);
  // A forged issuedBy marker and signed-looking but invalid bytes fail closed.
  await db.collection("consentDecisionReceipts").doc(receiptId).update({issuerSignature:"A".repeat(86)});
  await rejects(grantFamilyStoryView,req(grandma,{
    sessionId:first,recipientUid:mom.uid,consentReceiptId:receiptId,expiresInDays:1
  }));
  await db.collection("consentDecisionReceipts").doc(receiptId).update({issuerSignature:receipt.issuerSignature});
  // This is only a SYNTHETIC TEST KEY, not a canonical Privacy-issued signature.
  const expectedKeyId = process.env.STORYTIME_FAMILY_PRIVACY_ED25519_KEY_ID;
  const approvedPublicKey = process.env.STORYTIME_FAMILY_PRIVACY_ED25519_PUBLIC_KEY_SPKI_B64;
  delete process.env.STORYTIME_FAMILY_PRIVACY_ED25519_PUBLIC_KEY_SPKI_B64;
  await rejects(grantFamilyStoryView,req(grandma,{
    sessionId:first,recipientUid:mom.uid,consentReceiptId:receiptId,expiresInDays:1
  }));
  process.env.STORYTIME_FAMILY_PRIVACY_ED25519_PUBLIC_KEY_SPKI_B64 = approvedPublicKey;
  process.env.STORYTIME_FAMILY_PRIVACY_ED25519_KEY_ID = "unapproved-test-issuer";
  await rejects(grantFamilyStoryView,req(grandma,{
    sessionId:first,recipientUid:mom.uid,consentReceiptId:receiptId,expiresInDays:1
  }));
  process.env.STORYTIME_FAMILY_PRIVACY_ED25519_KEY_ID = expectedKeyId;
  const g=await grantFamilyStoryView.run(req(grandma,{
    sessionId:first,recipientUid:mom.uid,consentReceiptId:receiptId,expiresInDays:1
  }));
  assert.equal(g.granted,true);
  await db.collection("consentDecisionReceipts").doc(receiptId).update({recipientUid:outsider.uid});
  await rejects(getFamilyStoryView,req(mom,{sessionId:first,ownerUid:grandma.uid}));
  await db.collection("consentDecisionReceipts").doc(receiptId).update({recipientUid:mom.uid});
  const view=await getFamilyStoryView.run(req(mom,{sessionId:first,ownerUid:grandma.uid}));
  assert.equal(view.title,"Synthetic grandma shared childhood story");
  assert.equal(view.summary,"Synthetic story summary for "+first);
  assert.deepEqual(Object.keys(view).sort(),["ownerUid","provenance","sessionId","summary","title"].sort());
  assert.ok(!JSON.stringify(view).includes("Synthetic private family recording"));
  // A later edited summary is never silently shared under the old grant.
  await db.collection("storyChapters").doc("synthetic-chapter-one").update({
    summary:"Synthetic edited text not approved by the owner"
  });
  await rejects(getFamilyStoryView,req(mom,{sessionId:first,ownerUid:grandma.uid}));
  await db.collection("storyChapters").doc("synthetic-chapter-one").update({summary});
  // Even a previously approved grant is unusable if the source owner account
  // is disabled, independently of the recipient token and receipt status.
  await auth.updateUser(grandma.uid,{disabled:true});
  await rejects(getFamilyStoryView,req(mom,{sessionId:first,ownerUid:grandma.uid}));
  await auth.updateUser(grandma.uid,{disabled:false});
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
