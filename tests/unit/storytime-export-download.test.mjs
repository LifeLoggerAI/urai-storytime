import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

const raw = readFileSync('src/lib/storytime/export-download.ts', 'utf8');
const { fetchAuthorizedStorytimeExport } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(raw)).toString('base64')}`);
const body = JSON.stringify({ sourceRepo: 'LifeLoggerAI/urai-storytime', collections: {} });
function authorization() {
  const expiresAt = Date.now() + 60_000;
  return { privacyRequestId: 'owner_request', requiresAuthorization: true, expiresAt: new Date(expiresAt).toISOString(),
    packageSha256: createHash('sha256').update(body).digest('hex'),
    url: `https://us-central1-urai-storytime-test.cloudfunctions.net/downloadStorytimeExportPackage?privacyRequestId=owner_request&expiresAt=${expiresAt}&authorityHash=${'a'.repeat(64)}` };
}

test('actual Storytime browser client sends fresh Bearer fetch with private transport and verifies package', async () => {
  let tokenCalls = 0; let observed;
  const blob = await fetchAuthorizedStorytimeExport({ authorization: authorization(), projectId: 'urai-storytime-test',
    isCurrentAccount: () => true, getIdToken: async () => { tokenCalls++; return 'synthetic-current-token'; },
    fetcher: async (url, options) => { observed = { url, options }; return new Response(body, { headers: { 'content-type': 'application/json' } }); } });
  assert.equal(tokenCalls, 1); assert.equal(await blob.text(), body);
  assert.deepEqual(observed.options, { method: 'GET', headers: { Authorization: 'Bearer synthetic-current-token' },
    cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
});

for (const [name, mutate] of [
  ['foreign host', grant => { grant.url = grant.url.replace('urai-storytime-test', 'foreign-project'); }],
  ['foreign path', grant => { grant.url = grant.url.replace('downloadStorytimeExportPackage', 'public'); }],
  ['plain HTTP', grant => { grant.url = grant.url.replace('https:', 'http:'); }],
  ['user info', grant => { grant.url = grant.url.replace('https://', 'https://user:password@'); }],
  ['foreign port', grant => { grant.url = grant.url.replace('.net/', '.net:444/'); }],
  ['missing protected flag', grant => { grant.requiresAuthorization = false; }],
  ['changed owner request', grant => { grant.privacyRequestId = 'foreign_request'; }],
  ['expired authority', grant => { grant.expiresAt = new Date(Date.now() - 1).toISOString(); }]
]) {
  test(`${name} is rejected before exposing a Firebase token`, async () => {
    const grant = authorization(); mutate(grant); let tokenCalls = 0; let fetchCalls = 0;
    await assert.rejects(fetchAuthorizedStorytimeExport({ authorization: grant, projectId: 'urai-storytime-test',
      isCurrentAccount: () => true, getIdToken: async () => { tokenCalls++; return 'synthetic'; }, fetcher: async () => { fetchCalls++; return new Response(body); } }));
    assert.equal(tokenCalls, 0); assert.equal(fetchCalls, 0);
  });
}

test('wrong package digest is rejected after authenticated response', async () => {
  await assert.rejects(fetchAuthorizedStorytimeExport({ authorization: authorization(), projectId: 'urai-storytime-test',
    isCurrentAccount: () => true, getIdToken: async () => 'synthetic', fetcher: async () => new Response('{"changed":true}', { headers: { 'content-type': 'application/json' } }) }), /integrity/);
});
test('a browser auth epoch change withholds an export even when the owner identity is unchanged', async () => {
 let current = true;
 await assert.rejects(fetchAuthorizedStorytimeExport({ authorization: authorization(), projectId: 'urai-storytime-test',
  getIdToken: async () => 'synthetic-current-token', isCurrentAccount: () => current,
  fetcher: async () => { current = false; return new Response(body, { headers: { 'content-type': 'application/json' } }); } }), /account changed/);
});
