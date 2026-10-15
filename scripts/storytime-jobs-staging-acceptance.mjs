#!/usr/bin/env node
// UrAi disposable Storytime/Jobs acceptance. No media creation or provider spend.
// Phase preflight makes no requests; verify checks Auth/foreign denial;
// exercise requires an operator-preseeded, already-revoked synthetic job.
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const modes = new Set(["staging", "emulator"]);
const phases = new Set(["preflight", "verify", "exercise"]);
const fail = code => { throw new Error(code); };
const value = (env, key) => {
  const v = String(env[key] || "").trim();
  if (!v) fail("missing_" + key.toLowerCase());
  return v;
};
const hash = s => createHash("sha256").update(String(s)).digest("hex").slice(0, 16);
const disposable = s => /^urai-wave31-(owner|other)-[a-z0-9-]+@(example\.com|example\.test|test\.invalid)$/i.test(s);

export function validateTarget(env, mode, phase) {
  if (!modes.has(mode) || !phases.has(phase)) fail("invalid_mode_or_phase");
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
export async function runAcceptance({env=process.env,mode="staging",phase="preflight",fetchImpl=fetch}={}) {
  const cfg=validateTarget(env,mode,phase);
  const evidence={
    schemaVersion:"urai-storytime-jobs-acceptance-v1",
    mode,phase,classification:"PREFLIGHT_ONLY",projectFingerprint:hash(cfg.project),
    runFingerprint:cfg.runId?hash(cfg.runId):null,checks:[],
    remoteCloudDeletionIndependentlyVerified:false,
    sourceDispatchExercised:false,paidProviderGenerationTriggered:false,cleanupPerformed:false
  };
  if (phase==="preflight") {
    evidence.checks.push("strict_staging_or_emulator_identity_preflight");return evidence;
  }
  const [owner,other]=await Promise.all([
    signIn(fetchImpl,env,cfg,"owner"),signIn(fetchImpl,env,cfg,"other")
  ]);
  if (owner.uid===other.uid) fail("test_users_not_distinct");
  evidence.checks.push("provider_verified_two_disposable_auth_identities");
  const jobId=value(env,"STORYTIME_ACCEPTANCE_VOICEOVER_JOB_ID");
  expectDenied(await manage(fetchImpl,cfg,other.token,jobId,"status"),"foreign_status_not_denied");
  evidence.checks.push("foreign_status_denied");
  if (phase==="verify") {
    evidence.classification=mode==="staging"?"STAGING_AUTH_AND_DENIAL_ONLY":"EMULATOR_AUTH_AND_DENIAL_ONLY";
    return evidence;
  }
  const status=await manage(fetchImpl,cfg,owner.token,jobId,"status");
  if (!status.success || !status.result.job?.status) fail("owner_fixture_status_missing");
  evidence.checks.push("owner_status_verified");
  expectDenied(await manage(fetchImpl,cfg,owner.token,jobId,"playback"),
    "predeletion_playback_not_denied",true);
  evidence.checks.push("predeletion_playback_denied");
  const cancelled=await manage(fetchImpl,cfg,owner.token,jobId,"cancel");
  if (!cancelled.success || !["CANCELLED","SUCCESS","FAILED","DEAD"].includes(
    String(cancelled.result.job?.status||""))) fail("remote_job_cancellation_unconfirmed");
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
  evidence.classification=mode==="staging"?"STAGING_DISPOSABLE_CALLABLE_RESPONSES":
    "EMULATOR_DISPOSABLE_CALLABLE_RESPONSES";
  evidence.cleanupRequired=true;
  return evidence;
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const args=process.argv.slice(2);
  if (args.some(s=>!/^--(mode|phase)=[a-z]+$/.test(s))) fail("unsupported_arguments");
  const get=(k,f)=>args.find(s=>s.startsWith("--"+k+"="))?.split("=")[1]||f;
  runAcceptance({mode:get("mode","staging"),phase:get("phase","preflight")})
    .then(proof=>process.stdout.write(JSON.stringify(proof,null,2)+"\n"))
    .catch(e=>{
      // No URLs, request bodies, IDs, passwords, bearer tokens or private data.
      process.stderr.write("acceptance_denied:"+
        String(e?.message||"unknown").replace(/[^A-Za-z0-9_-]/g,"").slice(0,110)+"\n");
      process.exitCode=1;
    });
}
