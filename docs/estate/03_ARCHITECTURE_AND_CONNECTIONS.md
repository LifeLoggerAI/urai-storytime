# Storytime 03 — Architecture and cross-system connections

**Review only — production HOLD.** Baseline main 73f586a0a2931961ae221af7cfc0caf1b6aef39d; unmerged #97 source 312240f5da9042a2cc9d11dac179bed90dee51d1. Observed 2026-11-07. No private user records inspected.


## Main source topology
Next.js/React routes: /storytime, /storytime/settings, /storytime/[sessionId], /share/story/[shareId]. Functions v2 Node 22 exports via functions/src/index.ts generation/cancellation/reconciliation, share/revoke, narrator/arc/weekly/timeline/archive, finite-time registry, health, data rights, moderation, drafts, versions and Jobs voiceover.

**Private creation path:** verified Firebase adult/guardian request + explicit generation/provider consent + request review → safety check → idempotent claim/quota/provider spend preflight → configured OpenAI adapter OR nonproduction local builder → structured output/moderation → persisted storySessions, storyChapters, storyMoments, memoryScenes, narratorScripts, emotionalArcSummaries, storyVersions, storyGenerationRequests. Completion is a database receipt, not media delivery.

## Integration edges and actual acceptance
| Edge | Source contract | Classification / gap |
|---|---|---|
| UrAi/real memory graph → Storytime | types.ts memory_snapshot option, storytime.ts sourceSignals/memoryUse, life-movie-story-graph.mjs | No verified, active source-resolving memory graph importer, immutable source receipt, or owner consent lineage observed in generateStorySession; **unverified** |
| Storytime → Studio | buildStudioNarrativeGraphEnvelope in integration-contracts.ts | Hard-off contract, no approved live Studio rendering |
| Storytime → Content | buildContentStoryPackageEnvelope | Hard-off editorial package, no receiving production publish proof |
| Storytime → Spatial/Replay | buildSpatialReplayManifestEnvelope | Hard-off schema requiring captions/text/reduced-motion; no device owner-only Replay |
| Storytime → Asset Factory | asset-factory.ts can POST /v1/jobs but STORYTIME_ASSET_FACTORY_EXECUTION defaults false | Adapter exists; no provider approval or spend/runtime receipt |
| Storytime → Jobs narrator | prepareVoiceoverJob/manageVoiceoverJob, external bridge URL/token, storytime.voiceover consent receipt | Active callable source and downstream Jobs bridge source; no integrated protected live narration/audio cleanup proven |
| Storytime → Privacy | own privacy-requests.ts / privacy-execution.ts | Own scoped data rights source; not account-wide UrAi export/deletion or provider/backup purge proof |
| Storytime → Admin/moderation | moderation-operations.ts/safety-reports.ts | Admin claim and minimized queue source; live IAM and appeals unknown |
| Storytime → Analytics | StoryAnalyticsEvent, analytics-adapter.mjs | Types/minimal adapters, not proven privacy-safe telemetry deployment |
| Storytime → FINITE TIME film | src/lib/finite-time and docs/finite-time | Governed preproduction/shot graphs only; final-render authorization false |

## Firebase release boundary
Main and #97 .firebaserc still identify default **REPLACE_WITH_URAI_STORYTIME_STAGING**. firebase.json declares Hosting Next source, Firestore rules/indexes, Storage rules and Functions nodejs22. Template env disables cloud, sharing, provider spend and media execution. Do not infer deployed target from a .firebaserc alias, domain name, or named URL. #97 only adds an unmerged package-controlled deployment preflight; it does not prove a real target or block arbitrary manual commands. Verify cloud project identity, signed actor authority, Rules exclusivity, deploy digest and rollback *separately*.
