import { after, before, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "urai-family-legacy-deny-r1603",
    firestore: { rules: await readFile(new URL("../../firestore.rules", import.meta.url), "utf8") },
  });
});
beforeEach(async () => env.clearFirestore());
after(async () => { if (env) await env.cleanup(); });
async function seed(path,data) {
  await env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(),path),data));
}
test("legacy stories and storyRuns deny all client CRUD, including same-family owner, guardian, viewer and admin",async()=>{
  await seed("families/synthetic-family",{
    members:{
      syntheticGrandma:{role:"owner"},
      syntheticMom:{role:"guardian"},
      syntheticCousin:{role:"viewer"},
    },
  });
  for(const collection of ["stories","storyRuns"]) {
    const path=collection+"/synthetic-grandma-memory";
    await seed(path,{
      familyId:"synthetic-family",userId:"syntheticGrandma",
      title:"Synthetic Grandma memory",rawPhotoPath:"private-photo.png",
      narration:"Private synthetic audio source",storyOwnerUid:"syntheticGrandma",
    });
    for(const ctx of [
      env.authenticatedContext("syntheticGrandma"),
      env.authenticatedContext("syntheticMom"),
      env.authenticatedContext("syntheticCousin"),
      env.authenticatedContext("syntheticOutsider"),
      env.authenticatedContext("syntheticAdmin",{admin:true}),
      env.unauthenticatedContext(),
    ]) {
      const db=ctx.firestore();
      await assertFails(getDoc(doc(db,path)));
      await assertFails(setDoc(doc(db,collection+"/forged-"+ctx.toString().replace(/[^A-Za-z0-9]/g,"").slice(0,12)),{
        familyId:"synthetic-family",userId:"syntheticGrandma",title:"forged",
      }));
      await assertFails(updateDoc(doc(db,path),{title:"tampered"}));
      await assertFails(deleteDoc(doc(db,path)));
    }
  }
});
test("server-preserved legacy documents survive client-deny rules for later reviewed migration/export",async()=>{
  await seed("stories/legacy-one",{familyId:"synthetic-family",title:"synthetic unshared record"});
  await seed("storyRuns/legacy-run",{familyId:"synthetic-family",status:"synthetic done"});
  await env.withSecurityRulesDisabled(async ctx => {
    await assertSucceeds(getDoc(doc(ctx.firestore(),"stories/legacy-one")));
    await assertSucceeds(getDoc(doc(ctx.firestore(),"storyRuns/legacy-run")));
  });
});
