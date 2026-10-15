#!/usr/bin/env node
// UrAi disposable Storytime/Jobs acceptance. No media creation or provider spend.
// Phase preflight makes no requests; verify checks Auth/foreign denial;
// exercise requires an operator-preseeded, already-revoked synthetic job.
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const modes = new Set(["staging", "emulator"]);
const phases = new Set(["preflight", "verify", "exercise", "emulator-auth"]);
class AcceptanceDenial extends Error {}
const fail = code => { throw new AcceptanceDenial(code); };
// Provider/network exceptions are not safe to print: their messages may contain
// service URLs, credentials, or other request data.
export function safeDenialCode(error) {
  return error instanceof AcceptanceDenial
    ? error.message.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 110)
    : "unexpected_execution_failure";
}
const value = (env, key) => {
  const v = String(env[key] || "").trim();
  if (!v) fail("missing_" + key.toLowerCase());
  return v;
};
const hash = s => createHash("sha256").update(String(s)).digest("hex").slice(0, 16);
const disposable = s => /^urai-wave31-(owner|other)-[a-z0-9-]+@(example\.com|example\.test|test\.invalid)$/i.test(s);

export function validateTarget(env, mode, phase) {
  if (!modes.has(mode) || !phases.has(phase)) fail("invalid_mode_or_phase");
  if (phase==="emulator-auth" && mode!=="emulator") fail("emulator_auth_requires_demo_project");
  const project = value(env,"URAI_STORYTIME_FIREBASE_PROJECT_ID");
  if (!/^[a-z][a-z0-9-]{4,35}$/.test(project) || project.includes("REPLACE")) fail("invalid_project");
  if (mode === "staging") {
    for (const field of ["URAI_STORYTIME_STAGING_TARGET",
      "URAI_STORYTIME_APPROVED_STAGING_PROJECT_ID","GOOGLE_CLOUD_PROJECT"]) {
      if (value(env,field) !== project) fail("staging_project_binding_mismatch");
    }
    if (env.STORYTIME_FIREBASE_ISOLATED !== "true"
      || env.URAI_STORYTIME_ACCEPTANCE_STAGING_APPROVED !== "true") fail("staging_authority_missing");
    const prod = value(env,"URAI_STORYTIME_PRODUCTION_TARGET");
    if (project === prod || /(^urai-4dc1d$|^urai-staging$|^urai-jobs$|demo-|prod|production)/i.test(project))
      fail("shared_or_production_project_forbidden");
    if (project === env.URAI_CORE_FIREBASE_PROJECT_ID
      || project === env.URAI_ANALYTICS_FIREBASE_PROJECT_ID) fail("shared_project_forbidden");
    value(env,"STORYTIME_ACCEPTANCE_FIREBASE_WEB_API_KEY");
  } else {
    if (!/^demo-urai-storytime(?:-[a-z0-9-]+)?$/.test(project)) fail("emulator_project_must_be_demo");
    if (!/^(localhost|127\.0\.0\.1):\d{2,5}$/.test(String(env.FIREBASE_AUTH_EMULATOR_HOST || "")))
      fail("local_auth_emulator_required");
    if (!/^(localhost|127\.0\.0\.1):\d{2,5}$/.test(String(env.FIRESTORE_EMULATOR_HOST || "")))
      fail("local_firestore_emulator_required");
  }
  const runId = phase === "preflight" ? null : value(env,"STORYTIME_ACCEPTANCE_RUN_ID");
  if (runId && !/^wave31-[a-z0-9-]{8,60}$/.test(runId)) fail("disposable_run_id_required");
  if (phase !== "preflight") {
    const owner=value(env,"STORYTIME_ACCEPTANCE_OWNER_EMAIL");
    const other=value(env,"STORYTIME_ACCEPTANCE_OTHER_EMAIL");
    if (!disposable(owner) || !disposable(other) || owner.toLowerCase() === other.toLowerCase())
      fail("two_disposable_accounts_required");
    for (const field of ["STORYTIME_ACCEPTANCE_OWNER_PASSWORD","STORYTIME_ACCEPTANCE_OTHER_PASSWORD"])
      value(env,field);
    const job=value(env,"STORYTIME_ACCEPTANCE_VOICEOVER_JOB_ID");
    const session=value(env,"STORYTIME_ACCEPTANCE_SESSION_ID");
    if (!/^voiceoverJob_[A-Za-z0-9_-]{10,100}$/.test(job)
      || !/^wave31-[A-Za-z0-9_-]{8,100}$/.test(session) || !session.includes(runId))
      fail("disposable_fixture_required");
  }
  if (phase==="emulator-auth" && env.STORYTIME_ACCEPTANCE_EMULATOR_AUTH_APPROVED!=="true")
    fail("disposable_emulator_authority_missing");
  if (phase === "exercise" && (env.STORYTIME_ACCEPTANCE_MUTATION_APPROVED !== "true"
    || env.STORYTIME_ACCEPTANCE_REVOKED_FIXTURE_APPROVED !== "true"))
    fail("protected_fixture_mutation_approval_missing");
  const region=String(env.STORYTIME_ACCEPTANCE_FUNCTIONS_REGION || "us-central1");
  if (!/^[a-z]{2,15}-[a-z]{2,15}\d$/.test(region)) fail("invalid_region");
  let functionsOrigin;
  if (mode === "staging") functionsOrigin="https://"+region+"-"+project+".cloudfunctions.net";
  else {
    const port=Number(env.STORYTIME_ACCEPTANCE_FUNCTIONS_EMULATOR_PORT || 5001);
    if (!Number.isInteger(port) || port<1000 || port>65535) fail("invalid_emulator_port");
    functionsOrigin="http://127.0.0.1:"+port+"/"+project+"/"+region;
  }
  return {mode,phase,project,runId,functionsOrigin};
}
function tokenClaims(token,project) {
  const parts=String(token).split(".");
  if (parts.length!==3) fail("invalid_firebase_id_token");
  let claims;
  try { claims=JSON.parse(Buffer.from(parts[1],"base64url").toString("utf8")); }
  catch { fail("unreadable_firebase_id_token"); }
  if (claims.aud!==project || claims.iss!=="https://securetoken.google.com/"+project
    || !claims.sub) fail("firebase_audience_or_issuer_mismatch");
  // A correctly scoped but expired (or undated) token must not authorize even
  // a disposable staging operation. Firebase lookup remains the authority.
  const now=Math.floor(Date.now()/1000);
  if (!Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp)
    || claims.iat>now+30 || claims.iat<now-7200
    || claims.exp<=now+30 || claims.exp>now+7200 || claims.exp<=claims.iat)
    fail("firebase_token_expiration_invalid");
  return claims;
}
async function post(fetchImpl,url,data,token) {
  const abort=new AbortController();
  const timer=setTimeout(()=>abort.abort(),12000);
  try {
    const r=await fetchImpl(url,{
      method:"POST",redirect:"error",cache:"no-store",signal:abort.signal,
      headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},
      body:JSON.stringify(data)
    });
    let body;
    try { body=await r.json(); } catch { fail("nonjson_response"); }
    return {ok:r.ok,status:r.status,body};
  } finally {clearTimeout(timer);}
}
async function signIn(fetchImpl,env,cfg,role) {
  const upper=role.toUpperCase();
  const email=value(env,"STORYTIME_ACCEPTANCE_"+upper+"_EMAIL");
  const password=value(env,"STORYTIME_ACCEPTANCE_"+upper+"_PASSWORD");
  const key=cfg.mode==="staging"?value(env,"STORYTIME_ACCEPTANCE_FIREBASE_WEB_API_KEY"):"fake-api-key";
  const base=cfg.mode==="staging"?"https://identitytoolkit.googleapis.com/v1/accounts:":
    "http://"+env.FIREBASE_AUTH_EMULATOR_HOST+"/identitytoolkit.googleapis.com/v1/accounts:";
  const signin=await post(fetchImpl,base+"signInWithPassword?key="+encodeURIComponent(key),
    {email,password,returnSecureToken:true});
  if (!signin.ok || !signin.body.idToken) fail("firebase_signin_failed_"+role);
  const token=signin.body.idToken;
  const claim=tokenClaims(token,cfg.project);
  const lookup=await post(fetchImpl,base+"lookup?key="+encodeURIComponent(key),{idToken:token});
  const user=Array.isArray(lookup.body.users)?lookup.body.users[0]:null;
  if (!lookup.ok || !user || user.localId!==claim.sub || user.email?.toLowerCase()!==email.toLowerCase()
    || user.disabled===true || !disposable(user.email)) fail("firebase_identity_lookup_failed_"+role);
  return {token,uid:user.localId};
}
async function manage(fetchImpl,cfg,token,jobId,action) {
  const r=await post(fetchImpl,cfg.functionsOrigin+"/manageVoiceoverJob",
    {data:{voiceoverJobId:jobId,action}},token);
  if (!r.ok || r.body.error) {
    return {success:false,code:String(r.body.error?.status||r.body.error?.code||"").slice(0,80)};
  }
  const result=r.body.result??r.body.data;
  if (!result || result.ok!==true) fail("invalid_callable_envelope");
  return {success:true,result};
}
function expectDenied(result,reason,owner=false) {
  const allowed=owner?["FAILED_PRECONDITION","failed-precondition","PERMISSION_DENIED","permission-denied"]:
    ["PERMISSION_DENIED","permission-denied","UNAUTHENTICATED"];
  if (result.success || !allowed.includes(result.code)) fail(reason);
}

/** Native disposable Auth/Firestore/Functions owner denial. This does NOT
 * simulate a Jobs backend or certify cross-repository job acceptance. */
async function runNativeEmulatorAuth({env,cfg,fetchImpl}) {
  const {initializeApp,deleteApp}=await import("firebase-admin/app");
  const {getAuth}=await import("firebase-admin/auth");
  const {getFirestore}=await import("firebase-admin/firestore");
  const app=initializeApp({projectId:cfg.project},"urai-disposable-emulator-acceptance");
  const auth=getAuth(app),db=getFirestore(app);
  const id=value(env,"STORYTIME_ACCEPTANCE_VOICEOVER_JOB_ID");
  const sessionId=value(env,"STORYTIME_ACCEPTANCE_SESSION_ID");
  const ref=db.collection("voiceoverJobs").doc(id);
  const uids=[];
  let seeded=false,receipt;
  try {
    for (const role of ["owner","other"]) {
      const email=value(env,"STORYTIME_ACCEPTANCE_"+role.toUpperCase()+"_EMAIL");
      const password=value(env,"STORYTIME_ACCEPTANCE_"+role.toUpperCase()+"_PASSWORD");
      const user=await auth.createUser({email,password,emailVerified:true});
      try { await auth.setCustomUserClaims(user.uid,{acceptanceRunId:cfg.runId}); }
      catch(error) { await auth.deleteUser(user.uid); throw error; }
      uids.push(user.uid);
    }
    if ((await ref.get()).exists) fail("fixture_already_exists");
    await ref.create({userId:uids[0],acceptanceRunId:cfg.runId,
      acceptanceFixture:true,sessionId,narratorScriptId:sessionId+"-script",
      externalSystem:"urai-jobs",externalJobId:id.slice("voiceoverJob_".length),
      status:"cancelled",safeOutput:null});
    seeded=true;
    receipt=await runAcceptance({env,mode:"emulator",phase:"verify",fetchImpl});
    if (receipt.transport!=="network" || receipt.classification!=="EMULATOR_AUTH_AND_DENIAL_ONLY"
      || !receipt.checks.includes("foreign_status_denied")) fail("native_emulator_denial_unverified");
  } finally {
    let failed=false;
    try {
      if (seeded) {
        const current=await ref.get(),row=current.data();
        if (!current.exists || row?.userId!==uids[0] || row?.acceptanceRunId!==cfg.runId
          || row?.acceptanceFixture!==true || row?.sessionId!==sessionId)
          throw Error("changed_fixture");
        await ref.delete();
      }
      for (const uid of uids) {
        const user=await auth.getUser(uid);
        if (user.customClaims?.acceptanceRunId!==cfg.runId) throw Error("changed_user");
        await auth.deleteUser(uid);
      }
    } catch { failed=true; }
    await deleteApp(app).catch(()=>{failed=true;});
    if (failed) fail("emulator_cleanup_failed");
  }
  if (!receipt) fail("emulator_receipt_missing");
  return {...receipt,phase:"emulator-auth",classification:"EMULATOR_AUTH_AND_DENIAL_ONLY",
    checks:["native_disposable_fixture_created",...receipt.checks,"disposable_fixture_deleted","both_users_deleted"],
    authenticatedStagingVerified:false,sourceDispatchExercised:false,
    remoteCloudDeletionIndependentlyVerified:false,cleanupPerformed:true};
}

export async function runAcceptance({env=process.env,mode="staging",phase="preflight",fetchImpl=fetch}={}) {
  const cfg=validateTarget(env,mode,phase);
  // An injected transport is useful for offline tests, but its simulated
  // HTTP replies must never be reported as live Firebase acceptance.
  const injectedTransport=fetchImpl!==fetch;
  const evidence={
    schemaVersion:"urai-storytime-jobs-acceptance-v1",
    mode,phase,classification:"PREFLIGHT_ONLY",projectFingerprint:hash(cfg.project),
    runFingerprint:cfg.runId?hash(cfg.runId):null,checks:[],
    transport:phase==="preflight"?"offline":injectedTransport?"synthetic":"network",
    authenticatedStagingVerified:false,
    remoteCloudDeletionIndependentlyVerified:false,
    sourceDispatchExercised:false,paidProviderGenerationTriggered:false,cleanupPerformed:false
  };
  if (phase==="preflight") {
    evidence.checks.push("strict_staging_or_emulator_identity_preflight");return evidence;
  }
  if (phase==="emulator-auth") return runNativeEmulatorAuth({env,cfg,fetchImpl});
  const [owner,other]=await Promise.all([
    signIn(fetchImpl,env,cfg,"owner"),signIn(fetchImpl,env,cfg,"other")
  ]);
  if (owner.uid===other.uid) fail("test_users_not_distinct");
  evidence.checks.push(injectedTransport?"synthetic_disposable_identity_fixture":
    "provider_verified_two_disposable_auth_identities");
  const jobId=value(env,"STORYTIME_ACCEPTANCE_VOICEOVER_JOB_ID");
  expectDenied(await manage(fetchImpl,cfg,other.token,jobId,"status"),"foreign_status_not_denied");
  evidence.checks.push("foreign_status_denied");
  evidence.authenticatedStagingVerified=!injectedTransport && mode==="staging";
  if (phase==="verify") {
    evidence.classification=injectedTransport?"SYNTHETIC_AUTH_AND_DENIAL_ONLY":
      mode==="staging"?"STAGING_AUTH_AND_DENIAL_ONLY":"EMULATOR_AUTH_AND_DENIAL_ONLY";
    return evidence;
  }
  const expectedRemoteId=jobId.slice("voiceoverJob_".length);
  const status=await manage(fetchImpl,cfg,owner.token,jobId,"status");
  // Never invoke destructive actions against an identity inferred only from
  // the user's fixture variable. Confirm the Jobs status projection agrees.
  if (!status.success || !status.result.job?.status
    || status.result.job.jobId!==expectedRemoteId)
    fail("owner_fixture_remote_job_identity_mismatch");
  evidence.checks.push("owned_fixture_remote_job_identity_verified");
  expectDenied(await manage(fetchImpl,cfg,owner.token,jobId,"playback"),
    "predeletion_playback_not_denied",true);
  evidence.checks.push("predeletion_playback_denied");
  const cancelled=await manage(fetchImpl,cfg,owner.token,jobId,"cancel");
  if (!cancelled.success || cancelled.result.job?.jobId!==expectedRemoteId
    || !["CANCELLED","SUCCESS","FAILED","DEAD"].includes(
      String(cancelled.result.job?.status||""))) fail("bound_remote_job_cancellation_unconfirmed");
  evidence.checks.push("bound_job_terminal_cancel_response");
  const del=await manage(fetchImpl,cfg,owner.token,jobId,"delete-output");
  if (!del.success || del.result.deletion?.deleted!==true) fail("remote_deletion_response_unconfirmed");
  evidence.checks.push("jobs_deletion_response_confirmed");
  const again=await manage(fetchImpl,cfg,owner.token,jobId,"delete-output");
  if (!again.success || again.result.deletion?.deleted!==true) fail("deletion_retry_unconfirmed");
  evidence.checks.push("deletion_retry_idempotent");
  expectDenied(await manage(fetchImpl,cfg,owner.token,jobId,"playback"),
    "postdeletion_playback_not_denied",true);
  expectDenied(await manage(fetchImpl,cfg,owner.token,jobId,"status"),
    "stale_status_not_denied",true);
  expectDenied(await manage(fetchImpl,cfg,other.token,jobId,"delete-output"),
    "foreign_deletion_not_denied");
  evidence.checks.push("postdeletion_playback_denied","stale_status_denied","foreign_deletion_denied");
  evidence.classification=injectedTransport?"SYNTHETIC_DISPOSABLE_CALLABLE_RESPONSES":
    mode==="staging"?"STAGING_DISPOSABLE_CALLABLE_RESPONSES":
    "EMULATOR_DISPOSABLE_CALLABLE_RESPONSES";
  evidence.cleanupRequired=true;
  return evidence;
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  (async()=>{
    const args=process.argv.slice(2);
    if (args.some(s=>!/^--(?:mode=(?:staging|emulator)|phase=(?:preflight|verify|exercise|emulator-auth))$/.test(s))) fail("unsupported_arguments");
    const get=(k,f)=>args.find(s=>s.startsWith("--"+k+"="))?.split("=")[1]||f;
    const receipt=await runAcceptance({mode:get("mode","staging"),phase:get("phase","preflight")});
    process.stdout.write(JSON.stringify(receipt,null,2)+"\n");
  })().catch(e=>{
    // No URLs, request bodies, IDs, passwords, bearer tokens or private data.
    process.stderr.write("acceptance_denied:"+safeDenialCode(e)+"\n");
    process.exitCode=1;
  });
}
