import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
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
function fakeFetch({malformed=false,wrongAudience=false,wrongJobId=false,wrongCancelId=false}={}) {
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
    if (action==="status") return answer(200,{result:{ok:true,job:{
      status:"CANCELLED",jobId:wrongJobId?"foreign-job-009":"synthetic-job-001"
    }}});
    if (action==="playback") return answer(400,{error:{status:"FAILED_PRECONDITION"}});
    if (action==="cancel") return answer(200,{result:{ok:true,job:{
      status:"CANCELLED",jobId:wrongCancelId?"foreign-job-009":"synthetic-job-001"
    }}});
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

test("real Node CLI runs isolated demo preflight with redacted JSON and zero network",()=>{
  const executable=fileURLToPath(new URL("../../scripts/storytime-jobs-staging-acceptance.mjs",import.meta.url));
  const result=spawnSync(process.execPath,[executable,"--mode=emulator","--phase=preflight"],{
    env:{...process.env,URAI_STORYTIME_FIREBASE_PROJECT_ID:"demo-urai-storytime",
      FIREBASE_AUTH_EMULATOR_HOST:"127.0.0.1:9099",FIRESTORE_EMULATOR_HOST:"127.0.0.1:8080"},
    timeout:10000,encoding:"utf8"
  });
  assert.equal(result.status,0,result.stderr);
  const receipt=JSON.parse(result.stdout);
  assert.equal(receipt.mode,"emulator");
  assert.equal(receipt.phase,"preflight");
  assert.equal(receipt.remoteCloudDeletionIndependentlyVerified,false);
  assert.equal(receipt.cleanupPerformed,false);
  assert.deepEqual(receipt.checks,["strict_staging_or_emulator_identity_preflight"]);
  assert.equal(result.stdout.includes("demo-urai-storytime"),false);
});
test("real Node CLI returns nonzero and redacted denial for missing project and unknown flags",()=>{
  const executable=fileURLToPath(new URL("../../scripts/storytime-jobs-staging-acceptance.mjs",import.meta.url));
  for (const [args,envVars,expected] of [
    [["--mode=staging","--phase=preflight"],
      {...process.env,URAI_STORYTIME_FIREBASE_PROJECT_ID:""},
      "missing_urai_storytime_firebase_project_id"],
    [["--mode=staging","--phase=preflight","--deploy=true"],
      {...process.env,URAI_STORYTIME_FIREBASE_PROJECT_ID:""},
      "unsupported_arguments"]
  ]) {
    const result=spawnSync(process.execPath,[executable,...args],{
      env:envVars,timeout:10000,encoding:"utf8"
    });
    assert.equal(result.status,1);
    assert.match(result.stderr,new RegExp("acceptance_denied:"+expected));
    assert.equal(result.stdout,"");
    assert.doesNotMatch(result.stderr,/at file:|Error:|https?:\\/\\//);
  }
});
test("fixture mismatch is rejected before destructive remote cancel or delete",async()=>{
  const wrong=fakeFetch({wrongJobId:true});
  await assert.rejects(runAcceptance({env:env(),mode:"staging",phase:"exercise",
    fetchImpl:wrong.fetchImpl}),/owner_fixture_remote_job_identity_mismatch/);
  assert.deepEqual(wrong.calls,["test-other:status","test-owner:status"]);
  const cancel=fakeFetch({wrongCancelId:true});
  await assert.rejects(runAcceptance({env:env(),mode:"staging",phase:"exercise",
    fetchImpl:cancel.fetchImpl}),/bound_remote_job_cancellation_unconfirmed/);
  assert.equal(cancel.calls.includes("test-owner:cancel"),true);
  assert.equal(cancel.calls.some(s=>s==="test-owner:delete-output"),false);
});
