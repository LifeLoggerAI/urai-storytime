#!/usr/bin/env python3
"""Run only isolated synthetic Firebase emulators with a credential-free child."""
import os, pathlib, resource, subprocess, sys
root = pathlib.Path(__file__).resolve().parents[1]
logdir = root.parent / "custody"
logdir.mkdir(exist_ok=True)
env = {key: os.environ[key] for key in ("PATH", "HOME", "LANG", "TMPDIR") if key in os.environ}
env.update({
 "PATH": "/workspace/r1580-jre21/bin:" + env.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
 "GCLOUD_PROJECT": "demo-urai-family-r1591",
 "FIREBASE_AUTH_EMULATOR_HOST": "127.0.0.1:19099",
 "FIRESTORE_EMULATOR_HOST": "127.0.0.1:18080",
 "FIREBASE_STORAGE_EMULATOR_HOST": "127.0.0.1:19199",
 "STORAGE_EMULATOR_HOST": "http://127.0.0.1:19199",
 "FIREBASE_CONFIG": '{"projectId":"demo-urai-family-r1591","storageBucket":"demo-urai-family-r1591.appspot.com"}',
 "CI": "1",
 "CHOKIDAR_USEPOLLING": "true",
})
soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
resource.setrlimit(resource.RLIMIT_NOFILE, (min(8192, hard), hard))
with (logdir / "family-r1591-run.log").open("w") as log:
 def run(argv):
  result = subprocess.run(argv, cwd=root, env=env, stdout=log, stderr=subprocess.STDOUT)
  log.flush()
  if result.returncode: raise SystemExit(result.returncode)
 run(["npm","--prefix","functions","run","build"])
 # Synthetic in-memory test key, never a real Privacy authority.
 import json
 keygen = subprocess.run(["node","-e",
  "const {generateKeyPairSync}=require('node:crypto');"
  "const {publicKey,privateKey}=generateKeyPairSync('ed25519');"
  "console.log(JSON.stringify({pub:publicKey.export({type:'spki',format:'der'}).toString('base64'),"
  "priv:privateKey.export({type:'pkcs8',format:'der'}).toString('base64')}))"],
  env=env,cwd=root,capture_output=True,text=True,check=True)
 keys=json.loads(keygen.stdout)
 env["STORYTIME_FAMILY_PRIVACY_ED25519_KEY_ID"]="synthetic-r1591-local-key"
 env["STORYTIME_FAMILY_PRIVACY_ED25519_PUBLIC_KEY_SPKI_B64"]=keys["pub"]
 env["TEST_ONLY_FAMILY_PRIVATE_KEY_PKCS8_B64"]=keys["priv"]
 run(["node","--input-type=module","-e",
      "const {grantFamilyStoryView:f}=await import('./functions/lib/family-story-sharing.js');"
      "try{await f.run({data:{}});throw Error('default gate opened')}catch(e){"
      "if(e.code!=='failed-precondition')throw e;console.log('PASS default private family sharing remains disabled')}"])
 # Explicitly test only the isolated review callable. Ordinary deployments remain disabled.
 env["STORYTIME_FAMILY_SHARING_ENABLED"]="true"
 result = subprocess.run([
  "node", "/workspace/genesis/node_modules/firebase-tools/lib/bin/firebase.js",
  "emulators:exec", "--config", "firebase.family-r1591.emulators.json",
  "--project", "demo-urai-family-r1591", "--only", "auth,firestore,functions,storage",
  "node tests/integration/r1591-family-sharing.emulator.mjs"
 ], cwd=root, env=env, stdout=log, stderr=subprocess.STDOUT)
 (logdir / "family-r1591-run.exit").write_text(str(result.returncode)+"\n")
 raise SystemExit(result.returncode)
