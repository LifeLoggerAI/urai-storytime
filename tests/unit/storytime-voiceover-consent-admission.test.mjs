import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync('functions/src/storytime-voiceover-consent-admission.ts', 'utf8');
const { stageStorytimeVoiceoverConsent, completeStorytimeVoiceoverDispatch, markStorytimeVoiceoverDispatchUncertain, StorytimeVoiceoverAdmissionDenied } =
  await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const input = () => ({
  userId:'synthetic-owner',sessionId:'session-a',narratorScriptId:'script-a',
  consentReceiptId:'stvc_synthetic-001',policyVersion:'storytime-voiceover-consent-v1',
  sourceConsentVersion:'story-generation-consent-v1',
  narratorText:'Synthetic voiceover only.',createdAt:'2026-10-14T22:30:00.000Z',
  idempotencyKey:'synthetic-replay-key-01', requestFingerprint:'a'.repeat(64)
});
const receiptPath='consentDecisionReceipts/stvc_synthetic-001';
function fixture() {
  const docs=new Map(), versions=new Map(), observations={commits:0,conflicts:0,beforeCommit:null};
  const set=(path,value)=>{docs.set(path,structuredClone(value));versions.set(path,(versions.get(path)||0)+1)};
  const snapshot=path=>({exists:docs.has(path),data:()=>structuredClone(docs.get(path))});
  const db={
    collection:name=>({doc:id=>({path:name+'/'+id})}),
    async runTransaction(callback) {
      for(let attempt=0;attempt<5;attempt++) {
        const reads=new Map(),writes=[];
        const tx={
          async get(ref) {
            assert.equal(writes.length,0,'reads must precede writes');
            reads.set(ref.path,versions.get(ref.path)||0);return snapshot(ref.path);
          },
          create(ref,value) {writes.push([ref.path,value,false])},
          update(ref,value) {writes.push([ref.path,value,true])}
        };
        const result=await callback(tx);
        const concurrent=observations.beforeCommit;observations.beforeCommit=null;
        if(concurrent)concurrent();
        if([...reads].some(([path,v])=>(versions.get(path)||0)!==v)){
          observations.conflicts++;continue;
        }
        for(const [path,value,merge] of writes){
          if(!merge) assert.equal(docs.has(path),false,'receipt must not overwrite');
          set(path,merge?{...(docs.get(path)||{}),...value}:value);
        }
        observations.commits++;return result;
      }
      throw new Error('retry_exhausted');
    }
  };
  set('storySessions/session-a',{
    userId:'synthetic-owner',safetyStatus:'approved',
    consentSnapshot:{voiceover:true,consentVersion:'story-generation-consent-v1'}
  });
  set('narratorScripts/script-a',{
    userId:'synthetic-owner',sessionId:'session-a',text:'Synthetic voiceover only.'
  });
  return{db,set,docs,observations};
}

test('authorized source transaction commits a durable matching receipt',async()=>{
  const h=fixture();
  assert.deepEqual(await stageStorytimeVoiceoverConsent(h.db,input()),{reused:false});
  const receipt=h.docs.get(receiptPath);
  assert.equal(receipt.userId,input().userId);
  assert.equal(receipt.decision,'authorized');
  assert.equal(receipt.sourceSessionId,input().sessionId);
  assert.equal(h.observations.commits,1);
});
test('authorized replay leaves the earlier receipt unchanged',async()=>{
  const h=fixture();await stageStorytimeVoiceoverConsent(h.db,input());
  assert.deepEqual(await stageStorytimeVoiceoverConsent(h.db,{...input(),createdAt:'later'}),{reused:true});
  assert.equal(h.docs.get(receiptPath).createdAt,input().createdAt);
});
for(const [name,path,mutate] of [
  ['revoked session','storySessions/session-a',d=>({...d,consentSnapshot:{...d.consentSnapshot,voiceover:false}})],
  ['deleted session','storySessions/session-a',d=>({...d,deleted:true})],
  ['unsafe session','storySessions/session-a',d=>({...d,safetyStatus:'review_required'})],
  ['foreign session owner','storySessions/session-a',d=>({...d,userId:'foreign-owner'})],
  ['consent version changed','storySessions/session-a',d=>({...d,consentSnapshot:{...d.consentSnapshot,consentVersion:'new-policy'}})],
  ['changed narrator text','narratorScripts/script-a',d=>({...d,text:'Other text'})],
  ['foreign narrator script','narratorScripts/script-a',d=>({...d,userId:'foreign-owner'})],
  ['retired narrator script','narratorScripts/script-a',d=>({...d,retired:true})]
]) {
  test(name+' denies receipt admission without write',async()=>{
    const h=fixture();h.set(path,mutate(h.docs.get(path)));
    await assert.rejects(stageStorytimeVoiceoverConsent(h.db,input()),StorytimeVoiceoverAdmissionDenied);
    assert.equal(h.docs.has(receiptPath),false);
    assert.equal(h.observations.commits,0);
  });
}
test('revoked earlier receipt never regains authorization on replay',async()=>{
  const h=fixture();await stageStorytimeVoiceoverConsent(h.db,input());
  h.set(receiptPath,{...h.docs.get(receiptPath),decision:'revoked'});
  await assert.rejects(stageStorytimeVoiceoverConsent(h.db,input()),StorytimeVoiceoverAdmissionDenied);
  assert.equal(h.docs.get(receiptPath).decision,'revoked');
});
test('forged earlier owner identity never overwritten',async()=>{
  const h=fixture();h.set(receiptPath,{schemaVersion:'storytime-consent-decision-receipt-v1',id:'stvc_synthetic-001',
    userId:'foreign-owner',purpose:'storytime.voiceover',decision:'authorized'});
  await assert.rejects(stageStorytimeVoiceoverConsent(h.db,input()),StorytimeVoiceoverAdmissionDenied);
  assert.equal(h.docs.get(receiptPath).userId,'foreign-owner');
});
test('revocation racing the transaction commit forces retry and denial',async()=>{
  const h=fixture();
  h.observations.beforeCommit=()=>{
    const d=h.docs.get('storySessions/session-a');
    h.set('storySessions/session-a',{...d,consentSnapshot:{...d.consentSnapshot,voiceover:false}});
  };
  await assert.rejects(stageStorytimeVoiceoverConsent(h.db,input()),StorytimeVoiceoverAdmissionDenied);
  assert.equal(h.observations.conflicts,1);
  assert.equal(h.docs.has(receiptPath),false);
});

test('Jobs identity materializes job, export, event and reconciled intent atomically',async()=>{
  const h=fixture(),arg=input();
  await stageStorytimeVoiceoverConsent(h.db,arg);
  const result=await completeStorytimeVoiceoverDispatch(h.db,{
    ...arg,externalJobId:'synthetic-job-001',provider:'google',updatedAt:'later'
  });
  assert.equal(result.voiceoverJobId,'voiceoverJob_synthetic-job-001');
  assert.equal(h.docs.get('storytimeVoiceoverDispatchIntents/'+arg.idempotencyKey).state,'queued');
  assert.equal(h.docs.get('voiceoverJobs/'+result.voiceoverJobId).userId,arg.userId);
  assert.equal(h.docs.get('storyExports/'+result.exportId).private,true);
  assert.equal(h.docs.get('timelineReplayEvents/timelineReplayEvent_'+arg.idempotencyKey).userId,arg.userId);
});
test('idempotent replay does not duplicate local event or job metadata',async()=>{
  const h=fixture(),arg=input(),completion={...arg,externalJobId:'synthetic-job-001',provider:'google',updatedAt:'later'};
  await stageStorytimeVoiceoverConsent(h.db,arg);
  const first=await completeStorytimeVoiceoverDispatch(h.db,completion);
  const second=await completeStorytimeVoiceoverDispatch(h.db,completion);
  assert.equal(first.reused,false);assert.equal(second.reused,true);
  assert.equal([...h.docs.keys()].filter(x=>x.startsWith('voiceoverJobs/')).length,1);
  assert.equal([...h.docs.keys()].filter(x=>x.startsWith('timelineReplayEvents/')).length,1);
});
test('uncertain remote dispatch records retryable state without losing receipt',async()=>{
  const h=fixture(),arg=input();
  await stageStorytimeVoiceoverConsent(h.db,arg);
  await markStorytimeVoiceoverDispatchUncertain(h.db,arg,{state:'reconciliation_required',updatedAt:'later'});
  const intent=h.docs.get('storytimeVoiceoverDispatchIntents/'+arg.idempotencyKey);
  assert.equal(intent.state,'reconciliation_required');
  assert.equal(h.docs.get(receiptPath).decision,'authorized');
});
test('revoked consent after remote admission forbids local job materialization',async()=>{
  const h=fixture(),arg=input();
  await stageStorytimeVoiceoverConsent(h.db,arg);
  const sess=h.docs.get('storySessions/session-a');
  h.set('storySessions/session-a',{...sess,consentSnapshot:{...sess.consentSnapshot,voiceover:false}});
  await assert.rejects(completeStorytimeVoiceoverDispatch(h.db,{
    ...arg,externalJobId:'synthetic-job-001',provider:'google',updatedAt:'later'
  }),StorytimeVoiceoverAdmissionDenied);
  assert.equal([...h.docs.keys()].filter(x=>x.startsWith('voiceoverJobs/')).length,0);
});
