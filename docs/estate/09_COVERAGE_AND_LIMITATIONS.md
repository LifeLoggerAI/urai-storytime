# Storytime 09 — Coverage and limitations

**Recorded November 7, 2026. Production HOLD.**

| Category | Observed | Not established |
|---|---|---|
| Main recursive Git tree | 306 blobs, 53 directories, 1,356,257 GitHub-reported blob bytes; truncated=false; main 73f586a0a2931961ae221af7cfc0caf1b6aef39d | SHA-256 on each raw file, semantic review on all files |
| PR #97 recursive Git tree | 355 blobs, 55 directories, 1,946,848 bytes; truncated=false; head 312240f5da9042a2cc9d11dac179bed90dee51d1 | Main merge or whole historical object graph |
| Branch heads | 96 observed names/SHAs including isolated review branch | Deleted/unreachable branches, all historical blobs |
| Pull requests | 82 GitHub search results | Every comment, previous runner artifact, obsolete fork |
| Source semantics | Selected app, backend, schema, safety, Firebase, media and provenance modules read | All 306+355 full bodies reviewed |
| Tests | #96 green exact-head workflow and native disposable Firebase job | Fresh complete build/test at #97/#98, real production end-to-end |
| Recent CI | #97/#98 all three workflows red | Failure root causes, because latest failing job logs returned 404 BlobNotFound |
| Private memory and user media | None accessed | Actual owner memory capture, cross-system consent or protected replay |
| Provider/production | Provider adapter and fail-closed environment templates inspected | Actual paid call, provider receipt, deployed project, DNS, device acceptance |
| Assets | Git path/byte metadata for repository sources and SVGs, narration candidate | Real audio/video production, LFS objects, off-Git binaries, personal memory data |

Container git clone could not resolve github.com; this worker did not execute native source tests, install dependencies, access Firebase runtime or validate billing. Git blob object SHA is not a SHA-256 byte receipt. Existing master registry manifests are metadata too. Current scope is **inventoried_paths**, selected **semantic_reviewed**, with **historical isolated_test_verified** evidence at exact older heads, not entire-repo byte-complete or production verified.
