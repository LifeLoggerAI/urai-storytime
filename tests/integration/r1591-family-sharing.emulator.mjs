/**
 * Real local Firebase Auth/Functions/Firestore/Storage acceptance for the
 * review-only named story projection. Privacy receipts here are explicit
 * administrator-seeded FIXTURES. This does not certify canonical issuance,
 * cross-service receipt delivery, live IAM, raw media delivery, or release.
 */
import assert from "node:assert/strict";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createHash } from "node:crypto";

const projectId = "demo-urai-family-r1591";
assert.equal(process.env.GCLOUD_PROJECT, projectId);
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:19099");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:18080");
assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST, "127.0.0.1:19199");
for (const key of Object.keys(process.env)) {
  if (/^(GOOGLE_APPLICATION_CREDENTIALS|RUNPOD_API_KEY|VERCEL_TOKEN|GITHUB_TOKEN|GH_TOKEN|FIREBASE_TOKEN)$/.test(key))
    throw new Error("Secret-bearing test environment rejected");
}
initializeApp({ projectId, storageBucket: projectId + ".appspot.com" });
const auth = getAuth(), db = getFirestore(), bucket = getStorage().bucket();
const people = {};
const family = "synthetic-family";
const password = "Synthetic-only-r1591-local-pass";
for (const role of ["grandma", "mom", "outsider"]) {
  const uid = "r1591-" + role;
  const email = uid + "@example.test";
  await auth.createUser({ uid, email, password, emailVerified: true });
  const response = await fetch("http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-only", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.localId, uid);
  assert.ok(payload.idToken);
  people[role] = { uid, token: payload.idToken };
}
let pass = 0, fail = 0;
async function check(name, fn) {
  try { await fn(); pass++; console.log("PASS " + name); }
  catch (error) { fail++; console.error("FAIL " + name + ": " + error.message); }
}
async function call(name, actor, data) {
  const response = await fetch("http://127.0.0.1:15001/" + projectId + "/us-central1/" + name, {
    method: "POST", headers: { "content-type": "application/json", ...(actor ? {authorization: "Bearer " + actor.token} : {}) },
    body: JSON.stringify({data})
  });
  const payload = await response.json();
  if (payload.error) {
    const e = new Error(payload.error.status); e.code = payload.error.status; e.http = response.status; throw e;
  }
  assert.equal(response.status, 200);
  return payload.result;
}
async function denied(fn) {
  await assert.rejects(fn, e => ["PERMISSION_DENIED", "UNAUTHENTICATED", "FAILED_PRECONDITION"].includes(e.code));
}
const ownerUid = people.grandma.uid, recipientUid = people.mom.uid;
const sessionId = "r1591-one-memory", siblingId = "r1591-private-other";
const receiptId = "r1591-ADMIN-SEEDED-PRIVACY-FIXTURE";
const gid = createHash("sha256").update(JSON.stringify([sessionId, recipientUid])).digest("hex");
const view = (who=people.mom, extra={}) => call("getFamilyStoryView", who, {sessionId, ownerUid, ...extra});
const grant = (who=people.grandma) => call("grantFamilyStoryView", who, {
  sessionId, recipientUid, consentReceiptId: receiptId, expiresInDays: 1
});
const expiry = Timestamp.fromMillis(Date.now() + 3600_000);
const story = {
  userId: ownerUid, safetyStatus: "approved", visibility: "private", deleted: false,
  revoked: false, retired: false, status: "ready", currentVersionId: "v1",
  consentSnapshot: { memoryUse: true }, chapterIds: ["r1591-chapter-one"],
  title: "Synthetic memory for Mom",
  provenance: { sourceType: "synthetic_fixture", factualStatus: "synthetic_not_real_family_history" },
  privateRecording: "must-not-be-returned", privatePhoto: "must-not-be-returned"
};
await db.collection("storySessions").doc(sessionId).set(story);
await db.collection("storySessions").doc(siblingId).set({...story, title: "Private sibling"});
await db.collection("storyChapters").doc("r1591-chapter-one").set({
  userId: ownerUid, sessionId, summary: "A synthetic family memory.",
  privateNarratorScript: "must-not-be-returned"
});
const pRef = db.collection("consentDecisionReceipts").doc(receiptId);
const gRef = db.collection("familyStoryViewGrants").doc(gid);
const sRef = db.collection("storySessions").doc(sessionId);
await check("real emulator-issued distinct verified Firebase identities", async () => {
  const decoded = await Promise.all(Object.values(people).map(p=>auth.verifyIdToken(p.token,true)));
  assert.equal(new Set(decoded.map(x=>x.uid)).size,3);
  assert.ok(decoded.every(x=>x.email_verified===true));
});
await check("no receipt means grant denied",()=>denied(()=>grant()));
await check("no grant means Mom denied",()=>denied(()=>view()));
await check("anonymous caller denied",()=>denied(()=>view(null)));
await pRef.set({
  schemaVersion: "storytime-consent-decision-receipt-v1", id: receiptId,
  userId: ownerUid, sourceSessionId: sessionId, recipientUid,
  sourceVersionId: "v1", shareEpoch: 0,
  purpose: "storytime.family_share", policyVersion: "family-story-share-v1",
  decision: "authorized", revoked: false, issuedBy: "urai-privacy", expiresAt: expiry,
  testFixtureOnly: true
});
console.log("BOUNDARY: positive receipt is administrator-seeded FIXTURE, not canonical Privacy issuance.");
await check("outsider cannot issue Grandma grant",()=>denied(()=>grant(people.outsider)));
await check("verified Grandma grants exact memory using seeded receipt fixture",async()=>{
  const result=await grant(); assert.equal(result.granted,true); assert.equal(result.recipientUid,recipientUid);
});
await check("verified Mom opens only approved narrow story projection",async()=>{
  const result=await view();
  assert.equal(result.title,story.title); assert.equal(result.summary,"A synthetic family memory.");
  assert.deepEqual(Object.keys(result).sort(),["ownerUid","provenance","sessionId","summary","title"]);
  assert.ok(!JSON.stringify(result).includes("must-not-be-returned"));
});
await check("Mom cannot open Grandma sibling memory",()=>denied(()=>view(people.mom,{sessionId:siblingId})));
await check("another verified family account denied",()=>denied(()=>view(people.outsider)));
await check("wrong owner scope denied",()=>denied(()=>view(people.mom,{ownerUid:people.outsider.uid})));
await check("revoked Privacy fixture denies existing grant",async()=>{
  await pRef.update({revoked:true}); await denied(()=>view()); await pRef.update({revoked:false});
});
await check("expired Privacy fixture denies existing grant",async()=>{
  await pRef.update({expiresAt:Timestamp.fromMillis(Date.now()-1000)}); await denied(()=>view()); await pRef.update({expiresAt:expiry});
});
await check("changed source version invalidates grant",async()=>{
  await sRef.update({currentVersionId:"v2"}); await denied(()=>view()); await sRef.update({currentVersionId:"v1"});
});
await check("source memory consent withdrawal denies projection",async()=>{
  await sRef.update({"consentSnapshot.memoryUse":false}); await denied(()=>view()); await sRef.update({"consentSnapshot.memoryUse":true});
});
await check("owner canonical deletion fence denies projection and grant",async()=>{
  const ref=db.collection("privacyDeletionTombstones").doc(ownerUid);
  await ref.set({active:true}); await denied(()=>view()); await denied(()=>grant()); await ref.delete();
});
await check("recipient canonical deletion fence denies projection and grant",async()=>{
  const ref=db.collection("privacyDeletionTombstones").doc(recipientUid);
  await ref.set({active:true}); await denied(()=>view()); await denied(()=>grant()); await ref.delete();
});
await check("disabled source owner denies existing recipient projection",async()=>{
  await auth.updateUser(ownerUid,{disabled:true}); await denied(()=>view()); await auth.updateUser(ownerUid,{disabled:false});
});
await check("unverified source owner denies existing recipient projection",async()=>{
  await auth.updateUser(ownerUid,{emailVerified:false}); await denied(()=>view()); await auth.updateUser(ownerUid,{emailVerified:true});
});
await check("nested provenance metadata is never projected",async()=>{
  await sRef.update({provenance:{sourceType:{privateRecording:"must-not-leak"},factualStatus:["must-not-leak"]}});
  const result=await view(); assert.deepEqual(result.provenance,{type:"unverified",factualStatus:"unverified"});
  await sRef.update({provenance:story.provenance});
});
async function firestoreRest(path, actor, method="GET", data) {
  return fetch("http://127.0.0.1:18080/v1/projects/"+projectId+"/databases/(default)/documents/"+path,{
    method,headers:{"content-type":"application/json",authorization:"Bearer "+actor.token},
    ...(data?{body:JSON.stringify(data)}:{})
  });
}
await check("Mom cannot read source session directly through Firestore Rules",async()=>{
  const r=await firestoreRest("storySessions/"+sessionId,people.mom);assert.equal(r.status,403);
});
await check("Grandma still reads her source session through owner Rules",async()=>{
  const r=await firestoreRest("storySessions/"+sessionId,people.grandma);assert.equal(r.status,200);
});
await check("recipient cannot read grant or consent authority directly",async()=>{
  for(const path of ["familyStoryViewGrants/"+gid,"consentDecisionReceipts/"+receiptId]){
    const r=await firestoreRest(path,people.mom);assert.equal(r.status,403);
  }
});
await check("owner cannot fabricate client-side grant or canonical receipt",async()=>{
  for(const path of ["familyStoryViewGrants/r1591-client-forgery","consentDecisionReceipts/r1591-client-forgery"]){
    const r=await firestoreRest(path,people.grandma,"PATCH",{fields:{ownerUid:{stringValue:ownerUid}}});
    assert.equal(r.status,403);
  }
});
for (const fileName of ["test-photo.png","test-recording.wav"]) {
  await bucket.file("families/"+family+"/stories/"+sessionId+"/"+fileName).save(
    Buffer.from("SYNTHETIC TEST FIXTURE. NO FAMILY MEDIA."),{metadata:{contentType:"application/octet-stream"}});
}
await check("all raw test photo and recording delivery remains denied",async()=>{
  for(const actor of [people.grandma,people.mom,people.outsider]){
    for(const fileName of ["test-photo.png","test-recording.wav"]){
      const path="families/"+family+"/stories/"+sessionId+"/"+fileName;
      const r=await fetch("http://127.0.0.1:19199/v0/b/"+bucket.name+"/o/"+encodeURIComponent(path)+"?alt=media",{
        headers:{authorization:"Bearer "+actor.token}});
      assert.equal(r.status,403);
    }
  }
});
await check("owner client cannot write private media",async()=>{
  const path="families/"+family+"/stories/"+sessionId+"/client-photo.png";
  const r=await fetch("http://127.0.0.1:19199/v0/b/"+bucket.name+"/o?uploadType=media&name="+encodeURIComponent(path),{
    method:"POST",headers:{authorization:"Bearer "+people.grandma.token,"content-type":"application/octet-stream"},
    body:Buffer.from("synthetic")});
  assert.equal(r.status,403);
});
await check("owner revocation stops previously authorized view",async()=>{
  const result=await call("revokeFamilyStoryView",people.grandma,{sessionId,recipientUid});
  assert.equal(result.revoked,true); await denied(()=>view());
});
await check("old receipt cannot reissue revoked grant",()=>denied(()=>grant()));
await check("source deletion marker denies restored stale fixture",async()=>{
  await gRef.update({status:"active",shareEpoch:0});
  await db.collection("familyStorySharingStates").doc(sessionId).delete();
  await sRef.update({deleted:true}); await denied(()=>view()); await sRef.update({deleted:false});
});
await check("deleted source Auth account denies remaining recipient projection",async()=>{
  await auth.deleteUser(ownerUid); await denied(()=>view());
});
console.log("RESULT "+JSON.stringify({pass,fail,evidence:"real-local-emulators-with-explicit-Privacy-fixtures",canonicalPrivacyIssuance:false,rawMediaDelivery:false,globalDeletionComplete:false,production:"HOLD",privateMemoryWrites:"OFF"}));
process.exitCode = fail ? 1 : 0;
