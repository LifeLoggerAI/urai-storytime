# Storytime 01 — Source inventory and byte accounting

**Review only — production HOLD.** Baseline main 73f586a0a2931961ae221af7cfc0caf1b6aef39d; unmerged #97 source 312240f5da9042a2cc9d11dac179bed90dee51d1. Observed 2026-11-07. No private user records inspected.


## Reproducible complete *tree metadata* inventory
[MANIFEST.json](MANIFEST.json) enumerates every Git blob path, mode, Git SHA-1 object identity and GitHub-reported byte size in TWO untruncated recursive trees:
- Main: **306 files, 53 directories, 1,356,257 Git blob bytes**, source tree/main SHA 73f586a0a2931961ae221af7cfc0caf1b6aef39d.
- Open engineering PR #97: **355 files, 55 directories, 1,946,848 Git blob bytes**, head 312240f5da9042a2cc9d11dac179bed90dee51d1; stacked on #96/#83 and NOT merged main.
- Fresh branch-head snapshot: **96 names** including this isolated documentation branch; first 100-result GitHub page; not all branch contents read.
- Main file groups: 8 GitHub Actions workflows; 58 docs/evidence files; 26 Functions files; 39 launch-proof files; 2 legacy static demo files; 18 scripts; 69 src files; 70 tests; plus root Firebase JSON/rules, package/lock files and configuration.
- Actual source inspected semantically is listed in the manifest under source_content_read_files; many other files are only path/byte/Git-object inventoried.

**Git object SHA-1 is NOT SHA-256 of bytes.** No field in the machine manifest claims individual file SHA-256; those are null. The summed byte sizes are NOT downloaded/read-byte coverage. Preexisting separate private Genesis registry manifests enumerate these same two trees; this report does not falsely duplicate a historical full-byte certification.

## Asset categories and omissions
The tree includes source text, Markdown, JSON, scripts, Next/React code, schemas, tests, lockfiles, two SVG graphics, and a finite-time narration candidate TXT. This is **not** a downloaded library of live voiceovers, memory videos, private photos or licensed artwork. No protected Firebase Storage, external media provider object, off-Git Google Drive media, LFS actual objects, deleted Git history, unreachable commits, rendered video output, user memory, or real family story was retrieved. No file/branch/history missingness can be inferred solely from the two complete tree listings.

## Source roles
- Backend authority: functions/src/index.ts plus imported callable implementations, firestore.rules, storage.rules.
- Browser: src/app/storytime and src/components/storytime; client Firebase and runtime settings.
- Narrative canon: src/lib/storytime/types.ts, story-builder.ts, narrator-prompts.ts, src/life-movie-story-graph.mjs.
- Media/export: integration-contracts.ts, media-job-contract.ts, asset-factory.ts, src/lib/finite-time/*.
- Historical: launch-proof/*, legacy/static-demo/*, src/story-engine/providers/LocalDemoStoryProvider.mjs.
- Validation: tests/{unit,e2e,rules-emulator}, scripts, .github/workflows.

## Remaining coverage proof
Retrieve actual bytes and calculate SHA-256 for every accessible main, review, and distinct historical blob. Enumerate every branch tree/commit graph, tags, CI artifacts and actual LFS/media object with errors captured. Never access real private memories absent specific authorization.


## 2026-11-07 expanded historical branch-head inventory
All **96 observed Git branch heads** were now recursively inventoried and committed in `docs/estate/history/BRANCH_TREES_01.json` through `BRANCH_TREES_08.json`. Each tree response had `truncated=false` and no fetch error. Deduplicated summary: `docs/estate/history/BRANCH_HEAD_AGGREGATE.json`. Across all heads: **28,282 repeated file entries, 4,680 unique paths, 4,760 distinct Git SHA-1 blobs, 66,472,643 distinct Git-reported blob bytes**. One historical branch (`local-next-build-fixes@5ae2bde986f1eb30f516e8774ebe31a524abab42`) has 4,229 tracked blobs, of which many are checked-in `functions/node_modules` dependencies. 10 symbolic-link occurrences and 18 executable-file mode occurrences were recorded (all in that branch); no common native image/audio/video extension was observed among tracked branch-head paths. **External Storage audio/media is still uninspected; intermediate historical commits and raw SHA-256 remain outside coverage.** See `docs/estate/history/HISTORICAL_CHILD_STORYTIME_CANON_CONFLICT_20261107.md` for recovered 2024-dated archive and provenance caveats.
