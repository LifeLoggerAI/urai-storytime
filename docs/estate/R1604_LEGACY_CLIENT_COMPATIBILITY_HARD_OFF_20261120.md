# R1604 — Storytime legacy client compatibility contract and scan (Nov 20, 2026)

**Draft-only; production HOLD/NO-GO, private-memory writes OFF.**

## Source custody
Repository LifeLoggerAI/urai-storytime. Parent draft PR #122, exact base `e34d8dfa5aabdabf2dc95ba4435e70c6b77ffc75`; new [draft PR #123](https://github.com/LifeLoggerAI/urai-storytime/pull/123) exact implementation/test commit `6e01fda80bf901f77cde7b8e76f48bb20217f411`, Git tree `59922610d0d38dc5aefb711831029d3297dcab55`. Adding this evidence file changes only documentation after test execution.

Two substantive source paths: `src/firebase-adapter.mjs`, `tests/unit/r1604-legacy-client-compatibility-guard.test.mjs`. Original firestore.rules R1603 legacy deny draft remains unchanged.

## Compatibility findings
Active Next.js `src/app`, `src/components`, `src/lib` contains no direct `collection`, `doc`, or `collectionGroup` lookups of `stories` or `storyRuns` according to the new static focused test. Existing active Storytime screens use reviewed owner-scoped callable paths (`saveStoryDraft`, `generateStorySession`, `saveStoryRevision`) and newer owner-only collections. Legacy `src/firebase-adapter.mjs` exports `STORYTIME_COLLECTIONS.stories`/`storyRuns` for historical schema reference but previously had no explicit compatibility fence. Legacy `createLivePersistence` is already hard-off, independent of supplied Firebase config; old `urai_library` local-demo storage remains functional.

New immutable `LEGACY_FAMILY_COLLECTIONS`, `LEGACY_FAMILY_CLOUD_ACCESS` and `assertLegacyFamilyCloudAccessDenied` enforce explicit **no direct legacy cloud access** and server-reviewed migration-only intent in this adapter. Test proves old local-demo story remains readable; legacy live shim rejects cloud save/load/delete even with complete-looking synthetic config; active Next.js UI/library contains no direct old collections. This does not represent a completed rewrite of deployed clients.

## Source-bound actual Runpod results
Existing authorized CPU pod `vxmo8gjblvsvxg`, Node22.23.5; fetched exact source into detached worktree `/workspace/r1586-forward/storytime-r1604-legacy-compat-review`; no new pod, private family records, live Firebase or external cloud writes.

- Focused compatibility unit **4/4 PASS**, SHA256 `992a4aa92217707f4160c7c1771ae95666d6edfb2c4c93d623f22c9f76e3a634`.
- Root `npm test` **668/668 PASS**, zero failures/skips, SHA256 `f2a0cdd8fd2002fbbcf644392a5432b68c6a6f6df4c5d59e0459a490f30f7055`. The four new tests are included in this 668, not additional.
- Web `npm run typecheck` PASS, SHA256 `fd099a115a850bbf7f507245c53516be3710c4ba0e69ac48bc227fbd9e9f0503`.
- Functions `npm --prefix functions run build` PASS, SHA256 `c15a93f1cee1b0c82e92a3d8300c940c20bb7764b99b75dc452557925798facb`.
- No new Firebase Rules suite executed because Rules source is byte-identical to R1603. Parent R1603 28/28 Rules and 35/35 Auth+Functions+Firestore+Storage tests are historical and do not become new test receipts for R1604.

## Remaining migration and release gates
- Review previously deployed Storytime clients, local caches and actual persisted historical `stories` and `storyRuns` documents with read-only access. Identify family members who may lose direct access, owner-first export/backfill strategy, rollback impact and data retention before approving the R1603 deny policy. Static current-source scan alone is insufficient.
- Canonical Privacy `storytime.family_share` still unregistered/unapproved ([issue #334](https://github.com/LifeLoggerAI/urai-privacy/issues/334), [review-only signed wire #335](https://github.com/LifeLoggerAI/urai-privacy/pull/335)). No genuine signer, consent UI, revoke/ACK or real family media access.
- Jobs narrator GCS generation-bound deletion, live exclusive writer IAM/upload drain, actual authenticated hosted source, physical delete/export lifecycle, protected CI, device accessibility and independent security approval remain open.
- No Grandma Ashpole personal media, account, invite or permission was used. Review draft code is **NOT deployed**, and original production rules or users are untouched.

**PRODUCTION HOLD / NO-GO; PRIVATE-MEMORY WRITES OFF.**