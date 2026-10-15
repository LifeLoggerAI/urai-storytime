import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const src = readFileSync(new URL('../../src/lib/storytime/privacy-actor-lease.ts', import.meta.url), 'utf8')
const controls = readFileSync(new URL('../../src/components/storytime/PrivacyRequestControls.tsx', import.meta.url), 'utf8')
const { captureStorytimePrivacyActorLease, awaitCurrentStorytimePrivacyActor } =
  await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(src)).toString('base64'))

function fixture() {
  const actor = { uid: 'same-uid', emailVerified: true }
  let current = actor, generation = 9
  const lease = captureStorytimePrivacyActorLease(actor, generation, () => current, () => generation)
  return { actor, lease, switchActor(next) { current = next }, advanceEpoch() { generation++ } }
}

test('an unchanged verified owner retains exact source authority', async () => {
  const f = fixture(); assert.equal(f.lease.isCurrent(), true)
  assert.equal(await awaitCurrentStorytimePrivacyActor(f.lease, async () => 'safe-value'), 'safe-value')
})
for (const [label, invalidate] of [
  ['sign-out', f => f.switchActor(null)],
  ['same-UID User-object replacement', f => f.switchActor({ uid: f.actor.uid, emailVerified: true })],
  ['auth-notification epoch change', f => f.advanceEpoch()],
  ['verification withdrawal', f => { f.actor.emailVerified = false }],
]) {
  test(`${label} invalidates pending privacy authorizations`, async () => {
    const f = fixture(); let resolve
    const pending = new Promise(r => { resolve = r })
    let installed = false
    const task = (async () => {
      const value = await awaitCurrentStorytimePrivacyActor(f.lease, () => pending)
      installed = true
      return value
    })()
    invalidate(f); resolve('prior-actor-private-grant')
    await assert.rejects(task, /storytime_privacy_actor_changed/)
    assert.equal(installed, false, 'old privacy result must never reach UI settlement')
    let called = false
    await assert.rejects(() => awaitCurrentStorytimePrivacyActor(f.lease, async () => { called = true }), /storytime_privacy_actor_changed/)
    assert.equal(called, false, 'stale actors must not initiate new callable operations')
  })
}

test('a failed current operation remains a normal error, not false success', async () => {
  const f = fixture()
  await assert.rejects(() => awaitCurrentStorytimePrivacyActor(f.lease, async () => { throw new Error('provider-failed') }), /provider-failed/)
  assert.equal(f.lease.isCurrent(), true)
})

test('actual Storytime privacy controls gate all async settlements on exact actor', () => {
  assert.match(controls, /confirmationActor\.current !== actor/)
  assert.match(controls, /downloadActor\.current !== user/)
  assert.match(controls, /authEpoch\.current\+\+/)
  assert.match(controls, /confirmationActor\.current = null;\s*downloadActor\.current = null;/)
  assert.match(controls, /isCurrentAccount: \(\) => lease\.isCurrent\(\)/)
  assert.ok((controls.match(/awaitCurrentStorytimePrivacyActor\(lease/g) || []).length >= 5,
    'every owner-sensitive callable must be fenced across await')
  assert.ok((controls.match(/if \(lease\.isCurrent\(\)\) setWorking\(null\)/g) || []).length >= 3,
    'late callbacks must not clear the newer actor busy state')
})
