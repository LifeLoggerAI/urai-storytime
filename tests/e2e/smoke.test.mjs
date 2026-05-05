import test from 'node:test';import assert from 'node:assert/strict';import { spawn } from 'node:child_process';
const base='http://127.0.0.1:4173';
const srv=spawn('node',['scripts/server.mjs'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,500));
const html=await fetch(base).then(r=>r.text());
test('home loads',()=>assert.match(html,/URAI Storytime/));
const notFound=await fetch(base+'/missing').then(r=>r.status);
test('404 works',()=>assert.equal(notFound,404));
srv.kill();
