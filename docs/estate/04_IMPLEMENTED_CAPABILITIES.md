# Storytime 04 — Existing capability matrix

**Review only — production HOLD.** Baseline main 73f586a0a2931961ae221af7cfc0caf1b6aef39d; unmerged #97 source 312240f5da9042a2cc9d11dac179bed90dee51d1. Observed 2026-11-07. No private user records inspected.


| Feature | Source anchor | Actual classification / boundary |
|---|---|---|
| Next story app, auth UI and private sessions | src/app/storytime/*, src/components/storytime/* | source_verified; protected hosted user journey unverified |
| Structured private stories/chapters/moments/scenes | functions/src/storytime.ts, types.ts | source_verified; story content != factual source truth |
| OpenAI structured narrative provider | functions/src/story-provider.ts | source_verified adapter, live provider/spend unverified; disabled in template |
| Deterministic source-based fallback | src/lib/storytime/story-builder.ts, functions/src/storytime.ts | source_verified and nonproduction-only; not evidence of past fact |
| Explicit actor/request review/generation/provider flags | GenerateStorySchema | source_verified user input and auth; not verified external consent issuer/guardian status |
| Quotas/idempotency/cost receipt/dead letters | storytime.ts, story-provider.ts | source_verified; #83 newer unmerged fixes; production reconciliation unverified |
| Drafts without implicit provider permission | functions/src/story-drafts.ts | source_verified, owner transaction/revision |
| Saved edits/restores/versions | functions/src/story-versioning.ts | source_verified; no source-fact correction acceptance |
| Deterministic narrator, arc, week, timeline/archive | functions/src/generate-* and record builders | source_verified persistence; not audio or movie output |
| Governed Jobs TTS bridge | functions/src/storytime.ts prepare/manageVoiceoverJob | source_verified and #96 disposable emulator context; no live protected media acceptance |
| Moderation and public sharing | public-story-share-lifecycle.ts, moderation-operations.ts | source_verified; public derivative is fixed redacted placeholder, not user's actual story |
| FINITE TIME original production/shot graph | src/lib/finite-time/* | implemented preproduction contracts; render authority false |
| Studio, Asset Factory, Content, Spatial handoffs | integration-contracts.ts, media-job-contract.ts | deliberately hard-off; no protected integrated consumer |
| Historical family recollections/truth classes | src/life-movie-story-graph.mjs | pure source graph with truth classes; NOT embedded in generation path |
| Actual real UrAi memory graph ingestion | No live resolver found in inspected generation path | unverified, P0 for memory-origin stories |
| Language registry | src/lib/storytime/locales.ts | English enabled; 19 more hard-off |
| Private memories to XR movies | schemas/storyboards only | unverified generation and device delivery |
| Physical deletion across consumer, provider, backups | own privacy-execution source and #83 stacked repairs | unverified cross-system live completion |

An existing test fixture, generated sample, metadata package or successful offline CI is not a real private family narrative produced under valid owner/consent authority.
