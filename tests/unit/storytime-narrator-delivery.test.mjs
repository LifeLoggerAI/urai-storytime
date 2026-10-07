import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync('src/lib/storytime/narrator-delivery.ts', 'utf8');
const { fetchAuthorizedStorytimeNarrator } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);
const descriptor = () => ({ schemaVersion: 'urai-authenticated-private-media-v1', requiresAuthorization: true,
  action: 'deliver', kind: 'audio', authorityHash: 'a'.repeat(64), expiresAt: Date.now() + 60_000,
  generation: '42', jobId: 'jobs-a', sessionId: 'session-a', narratorScriptId: 'script-a' });

test('browser narrator adapter posts only the nonsecret descriptor to the pinned Storytime Firebase endpoint', async () => {
  let observed, tokens = 0;
  const d = descriptor();
  const blob = await fetchAuthorizedStorytimeNarrator({ projectId: 'urai-storytime-test', voiceoverJobId: 'voiceover-a', delivery: d,
    getIdToken: async () => { tokens++; return 'synthetic-firebase-token'; }, isCurrentAccount: () => true,
    fetcher: async (url, options) => { observed = { url, options }; return new Response('synthetic-audio', { headers: { 'content-type': 'audio/mpeg' } }); } });
  assert.equal(tokens, 1); assert.equal(await blob.text(), 'synthetic-audio');
  assert.equal(observed.url, 'https://us-central1-urai-storytime-test.cloudfunctions.net/deliverStorytimeVoiceover');
  assert.deepEqual(observed.options.headers, { Authorization: 'Bearer synthetic-firebase-token', 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(observed.options.body), { voiceoverJobId: 'voiceover-a', delivery: d });
  assert.equal(observed.options.redirect, 'error'); assert.equal(observed.options.cache, 'no-store');
  assert.equal(observed.options.credentials, 'omit'); assert.equal(observed.options.referrerPolicy, 'no-referrer');
  assert.equal(observed.options.body.includes('BRIDGE_TOKEN'), false);
});

for (const [name, mutate] of [
  ['old signed URL response', d => { delete d.requiresAuthorization; d.url = 'https://storage.invalid/signed'; }],
  ['expired descriptor', d => { d.expiresAt = Date.now() - 1; }],
  ['provider create action', d => { d.action = 'create'; }],
  ['foreign private kind', d => { d.kind = 'video'; }],
  ['missing authority', d => { d.authorityHash = ''; }],
  ['invalid generation', d => { d.generation = 'latest'; }]
]) {
  test(`${name} is denied before token retrieval or any network call`, async () => {
    const d = descriptor(); mutate(d); let tokens = 0, requests = 0;
    await assert.rejects(fetchAuthorizedStorytimeNarrator({ projectId: 'urai-storytime-test', voiceoverJobId: 'voiceover-a', delivery: d,
      getIdToken: async () => { tokens++; return 'synthetic'; }, isCurrentAccount: () => true, fetcher: async () => { requests++; return new Response(); } }));
    assert.equal(tokens, 0); assert.equal(requests, 0);
  });
}
test('a browser auth epoch change during audio delivery withholds the downloaded blob', async () => {
 let current = true;
 await assert.rejects(fetchAuthorizedStorytimeNarrator({ projectId: 'urai-storytime-test', voiceoverJobId: 'voiceover-a', delivery: descriptor(),
  getIdToken: async () => 'synthetic-firebase-token', isCurrentAccount: () => current,
  fetcher: async () => { current = false; return new Response('synthetic-audio', { headers: { 'content-type': 'audio/ogg' } }); } }));
});
