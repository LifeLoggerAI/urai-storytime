import test from "node:test";
import assert from "node:assert/strict";
import {runAcceptance,validateTarget} from "../../scripts/storytime-jobs-staging-acceptance.mjs";

const project="urai-storytime-staging-approved";
const env=()=>({
  URAI_STORYTIME_FIREBASE_PROJECT_ID:project,
  URAI_STORYTIME_STAGING_TARGET:project,
  URAI_STORYTIME_APPROVED_STAGING_PROJECT_ID:project,
  GOOGLE_CLOUD_PROJECT:project,
  URAI_STORYTIME_PRODUCTION_TARGET:"urai-storytime-production",
  URAI_CORE_FIREBASE_PROJECT_ID:"urai-4dc1d",
  URAI_ANALYTICS_FIREBASE_PROJECT_ID:"urai-analytics-prod",
  STORYTIME_FIREBASE_ISOLATED:"true",URAI_STORYTIME_ACCEPTANCE_STAGING_APPROVED:"true",
  STORYTIME_ACCEPTANCE_FIREBASE_WEB_API_KEY:"synthetic-key",
  STORYTIME_ACCEPTANCE_RUN_ID:"wave31-synthetic-001",
  STORYTIME_ACCEPTANCE_SESSION_ID:"wave31-synthetic-001-session",
  STORYTIME_ACCEPTANCE_VOICEOVER_JOB_ID:"voiceoverJob_synthetic-job-001",
  STORYTIME_ACCEPTANCE_OWNER_EMAIL:"urai-wave31-owner-a@example.com",
  STORYTIME_ACCEPTANCE_OTHER_EMAIL:"urai-wave31-other-b@example.com",
  STORYTIME_ACCEPTANCE_OWNER_PASSWORD:"synthetic-secret-owner",
  STORYTIME_ACCEPTANCE_OTHER_PASSWORD:"synthetic-secret-other",
  STORYTIME_ACCEPTANCE_MUTATION_APPROVED:"true",
  STORYTIME_ACCEPTANCE_REVOKED_FIXTURE_APPROVED:"true"
});
const fakeToken=(uid,proj=project)=>{
  const enc=o=>Buffer.from(JSON.stringify(o)).toString("base64url");
  return enc({alg:"none"})+"."+enc({sub:uid,aud:proj,
    iss:"https://securetoken.google.com/"+proj})+".fake";
};
function fakeFetch({malformed=false,wrongAudience=false}={}) {
  const calls=[];
  const answer=(status,data)=>({ok:status>=200&&status<300,status,async json(){return data}});
  const fetchImpl=async(url,options)=>{
    const data=JSON.parse(options.body);
    if (url.includes("signInWithPassword")) return answer(200,{
      idToken:fakeToken(data.email.includes("owner")?"test-owner":"test-other",
        wrongAudience?"urai-4dc1d":project)
    });
    if (url.includes("accounts:lookup")) {
      const claims=JSON.parse(Buffer.from(data.idToken.split(".")[1],"base64url").toString());
      return answer(200,{users:[{localId:claims.sub,
        email:claims.sub==="test-owner"?"urai-wave31-owner-a@example.com":"urai-wave31-other-b@example.com"}]});
    }
    assert.ok(url.endsWith("/manageVoiceoverJob"));
    const token=options.headers.Authorization.slice(7);
    const uid=JSON.parse(Buffer.from(token.split(".")[1],"base64url").toString()).sub;
    const action=data.data.action;
    calls.push(uid+":"+action);
    if (uid==="test-other") return answer(403,{error:{status:"PERMISSION_DENIED"}});
    if (action==="status" && calls.includes("test-owner:delete-output"))
      return answer(400,{error:{status:"FAILED_PRECONDITION"}});
    if (action==="status") return answer(200,{result:{ok:true,job:{status:"CANCELLED"}}});
    if (action==="playback") return answer(400,{error:{status:"FAILED_PRECONDITION"}});
    if (action==="cancel") return answer(200,{result:{ok:true,job:{status:"CANCELLED"}}});
    if (action==="delete-output") return answer(200,{result:{ok:true,deletion:{
      deleted:malformed?"true":true,alreadyDeleted:calls.filter(s=>s==="test-owner:delete-output").length>1
    }}});
    throw Error("unexpected_action");
  };
  return {calls,fetchImpl};
}
test("offline staging preflight never makes requests and refuses shared identities",async()=>{
  const mock=fakeFetch();
  const result=await runAcceptance({env:env(),mode:"staging",phase:"preflight",fetchImpl:mock.fetchImpl});
  assert.deepEqual(result.checks,["strict_staging_or_emulator_identity_preflight"]);
  assert.deepEqual(mock.calls,[]);
  for(const v of ["urai-staging","urai-4dc1d","urai-jobs","urai-storytime-production"]){
    const e={...env(),URAI_STORYTIME_FIREBASE_PROJECT_ID:v,
      URAI_STORYTIME_STAGING_TARGET:v,URAI_STORYTIME_APPROVED_STAGING_PROJECT_ID:v,
      GOOGLE_CLOUD_PROJECT:v};
    assert.throws(()=>validateTarget(e,"staging","preflight"));
  }
  assert.throws(()=>validateTarget({...env(),STORYTIME_FIREBASE_ISOLATED:"false"},"staging","preflight"));
});
test("only the local demo project with both emulator hosts passes emulator preflight",()=>{
  const e={...env(),URAI_STORYTIME_FIREBASE_PROJECT_ID:"demo-urai-storytime",
    FIREBASE_AUTH_EMULATOR_HOST:"127.0.0.1:9099",FIRESTORE_EMULATOR_HOST:"127.0.0.1:8080"};
  assert.equal(validateTarget(e,"emulator","preflight").mode,"emulator");
  assert.throws(()=>validateTarget({...e,FIREBASE_AUTH_EMULATOR_HOST:"evil.example:9099"},
    "emulator","preflight"));
  assert.throws(()=>validateTarget({...e,URAI_STORYTIME_FIREBASE_PROJECT_ID:"urai-4dc1d"},
    "emulator","preflight"));
});
test("verify authenticates two distinct disposable identities and denies foreign status",async()=>{
  const mock=fakeFetch();
  const result=await runAcceptance({env:env(),mode:"staging",phase:"verify",fetchImpl:mock.fetchImpl});
  assert.deepEqual(mock.calls,["test-other:status"]);
  assert.equal(result.classification,"STAGING_AUTH_AND_DENIAL_ONLY");
  assert.equal(result.remoteCloudDeletionIndependentlyVerified,false);
  assert.equal(JSON.stringify(result).includes("synthetic-secret"),false);
});
test("exercise verifies cancellation, deletion retry, tombstone and cross-owner denial",async()=>{
  const mock=fakeFetch();
  const result=await runAcceptance({env:env(),mode:"staging",phase:"exercise",fetchImpl:mock.fetchImpl});
  assert.deepEqual(mock.calls,["test-other:status","test-owner:status","test-owner:playback",
    "test-owner:cancel","test-owner:delete-output","test-owner:delete-output",
    "test-owner:playback","test-owner:status","test-other:delete-output"]);
  assert.equal(result.classification,"STAGING_DISPOSABLE_CALLABLE_RESPONSES");
  assert.equal(result.cleanupRequired,true);
  assert.equal(result.remoteCloudDeletionIndependentlyVerified,false);
  assert.equal(result.paidProviderGenerationTriggered,false);
});
test("malformed deletion reply aborts before reporting success or retry",async()=>{
  const mock=fakeFetch({malformed:true});
  await assert.rejects(runAcceptance({env:env(),mode:"staging",phase:"exercise",
    fetchImpl:mock.fetchImpl}),/remote_deletion_response_unconfirmed/);
  assert.equal(mock.calls.filter(s=>s==="test-owner:delete-output").length,1);
});
test("bad token audience and unapproved or real-user fixtures fail closed",async()=>{
  const mock=fakeFetch();
  await assert.rejects(runAcceptance({env:{...env(),STORYTIME_ACCEPTANCE_MUTATION_APPROVED:"false"},
    mode:"staging",phase:"exercise",fetchImpl:mock.fetchImpl}),/protected_fixture_mutation_approval_missing/);
  await assert.rejects(runAcceptance({env:{...env(),STORYTIME_ACCEPTANCE_OTHER_EMAIL:"person@gmail.com"},
    mode:"staging",phase:"verify",fetchImpl:mock.fetchImpl}),/two_disposable_accounts_required/);
  await assert.rejects(runAcceptance({env:env(),mode:"staging",phase:"verify",
    fetchImpl:fakeFetch({wrongAudience:true}).fetchImpl}),/firebase_audience_or_issuer_mismatch/);
  assert.deepEqual(mock.calls,[]);
});
