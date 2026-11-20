# R1603 — Legacy Family Stories client-boundary denial (review-only)

**Source and state:** LifeLoggerAI/urai-storytime [draft PR #122](https://github.com/LifeLoggerAI/urai-storytime/pull/122), stacked on draft PR #121. Exact executed code commit `8aa2cff772488c4c9a85e5135668793f8c75763c`, Git tree `9b01dcd49030445ed4dcc44841d76134fe778288`. This documentation file is a subsequent non-code change. **PRODUCTION HOLD / NO-GO; private-memory writes OFF.**

## Found and corrected (draft source only)
Legacy `firestore.rules` exposed `stories/{storyId}` and `storyRuns/{runId}` to any family member/role and admin-token client for reads, and allowed certain client writes. These rules predate exact named-recipient and signed-content family consent and were not covered by the newer owner-only `storySessions` rules. The draft replaces both legacy client paths with `allow read, write: if false`, leaving server-owned historical documents in place for authorized export/migration. No production rules changed.

New `tests/rules-emulator/legacy-family-story-private.test.mjs` checks a synthetic Grandma owner, Mom guardian, cousin viewer, unrelated account, admin-token client and signed-out client: reads, creates, updates, deletes are all denied for both collections; server-disabled-rules test setup retains readback of the old documents (not a production migration acceptance).

**Compatibility HOLD:** Existing legacy UI/client flows may depend on those reads/writes. Inventory all runtime usages and update them to the narrow permissioned server projection, independently review client migration/backfill/export/rollback and protected CI before any merge.

## Runpod exact-source execution
Existing Pod `vxmo8gjblvsvxg`, Node22.23.5/Java21. Source fetched from GitHub into separate detached worktree. Dependency installation reused; no production credentials, personal family media, GCS, cloud Firebase, new GPU or deployment.
| Execution | Result | log SHA256 |
| --- | --- | --- |
| `npm run typecheck` | **PASS exit 0** | `fd099a115a850bbf7f507245c53516be3710c4ba0e69ac48bc227fbd9e9f0503` |
| `npm --prefix functions run build` | **PASS exit 0** | `c15a93f1cee1b0c82e92a3d8300c940c20bb7764b99b75dc452557925798facb` |
| `npm test` | **664/664 PASS exit 0** | `1b626f93e3c613e28a71abc88de63a7d7f6df68b72b2130b3872f02082f6b4a6` |
| Disposable Firebase Auth+Firestore+Storage full sequential rules tests | **28/28 PASS exit 0** | `661bd325ea963f2522696ad74c3a109105dcb6046b3c2e3cc9b6c1718f97bd9a` |
| Firebase Auth+Functions+Firestore+Storage synthetic signed family callable HTTP | **35/35 PASS exit 0** | `a5d24c0bb2deed2a6d0c54b0c06f4ba8e4fb3266d485c9546f36496adb412d34` |

Failed/preflight attempts retained in `/tmp/urai-r1603-all-rules.log` (default 8080 port busy; zero tests), `/tmp/urai-r1603-all-rules-r2.log` (27/28 due absent compiled Functions lib from fresh worktree), and verified isolated-port successful run `/tmp/urai-r1603-all-rules-r3.log`. Local custody logs are not durable independent security signoff.

## Hard safety and next release gates
- **No real Grandma Ashpole account or records**; synthetic test stories, generated signed fixture only.
- Canonical `storytime.family_share` purpose not registered/approved: [Privacy issue #334](https://github.com/LifeLoggerAI/urai-privacy/issues/334), review-only [Privacy #335](https://github.com/LifeLoggerAI/urai-privacy/pull/335). Signature authenticity of test fixture does not establish issuer authority.
- Private media direct Storage access remains denied by prior source. Family voice/audio delivery, Jobs narrator generation-safe deletion and secure owner-specific export/physical deletion remain unproven.
- Live GCS broker/IAM single writer, stale-writer/upload drain, protected CI, actual hosted account journey, device/accessibility and independent approval remain open.
- Source is draft and unmerged; no production Firebase/Vercel/GCS/IAM modification, no GitHub protection bypass, no new compute.

**Review action:** Audit use of legacy `stories` and `storyRuns` throughout present apps, offline persistence/export and migrations. Keep deny proposal unmerged until approved alternate flows prove no data loss or access broadening. Production remains HOLD/NO-GO, private writes OFF.
