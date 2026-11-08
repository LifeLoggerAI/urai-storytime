# Storytime — Source-to-story provenance and factual authority

**Core rule: REMEMBERED FACT != RECORDED SOURCE != AI-GENERATED INTERPRETATION.**

Main source function generateStorySession explicitly creates fictionalized=true and factualStatus=creative_derivative_not_source_evidence. Its sourceType is direct_storytime_input and sourceId is a request identifier. The separate Life Movie story graph has RECORDED_SOURCE_TRUTH, ATTRIBUTED_FAMILY_RECOLLECTION, SPATIALLY_RECONSTRUCTABLE, INTERPRETIVE_CINEMATIC_RECREATION and UNKNOWN_UNRESOLVED truth classes. The inspected generation flow does NOT yet apply these classes to each generated assertion or validate actual private memory source bytes. All below are design requirements, **not claims of deployed implementation**.

| Claim kind | What makes it authoritative | Present source evidence | Unfinished proof |
|---|---|---|---|
| Recorded event/source | Explicit immutable owner-scoped source ID and hash, capture date, artifact provenance, authorized participant/owner and purpose | memory_snapshot type; sourceSignals array | No verified memory importer, source hash/citation or actual source permit in generation |
| Human/family recollection | Attribution to recollector, exact original wording/date, context, conflicts and recollection status | Life Movie graph recollections entries with source IDs/confidence | No active independently permitted source or source-monitoring review in generation |
| AI narrative interpretation | Provider, model, prompt/request and output hashes, fictionalized label, citations and uncertainty | generated session provider receipt, request SHA-256, creative derivative label, immutable versions | No output-sentence grounding against original sources or dispute ledger |
| Human correction | Immutable prior story version, editor and date, rationale and supported-versus-personal edit classification | saveStoryRevision / restoreStoryVersion | Edited narrative still must not rewrite actual original recording |
| Media derivative | Source story version and citations, signed owner purpose/consent, asset/model/retention hashes, revocation/deletion fences | hard-off Studio/Content/Spatial envelopes, Jobs voice bridge | No verified protective consumer runtime |

## Proposed claim ledger (not live)

For every asserted sentence or shot, persist privately a claimId, storySessionId, storyVersionId, claimTextSha256, category (recorded_source / attributed_recollection / ai_interpretation / unresolved), supporting and contradicting source IDs and hash receipts, capture/recollection dates, consent issuer/purpose/signed decision, current owner/revocation generation, model/version/prompt hash, confidence and alternative interpretations, exact correction history, downstream media IDs and deletion/review status. No private text or identifying source identifiers should be checked into this public review pack.

**Test acceptance:** a synthetic fixture with two contradictory recollections must remain visibly disputed; a fabricated scene may be aesthetically useful but never promoted to recorded evidence; revoked/not-owned original media must be excluded before generation and downstream delivery. No such exact integrated proof was executed here.
