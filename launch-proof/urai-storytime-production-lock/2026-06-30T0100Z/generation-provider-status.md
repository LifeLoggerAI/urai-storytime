# Generation provider status

## Classification

AI generation readiness: 48/100.

Current classification: SOURCE-PRESENT / PARTIAL / BLOCKED FROM LIVE CLAIMS.

## What exists

- Deterministic demo flow exists and is labeled as demo.
- Frontend cloud path calls `generateStorySession` only when runtime gates pass.
- Function requires auth, story-generation consent, basic safety screen, quota enforcement, and provider readiness.
- OpenAI adapter exists and requests strict JSON output.
- Provider readiness requires `STORYTIME_GENERATION_PROVIDER=openai`, `OPENAI_API_KEY`, and `STORYTIME_OPENAI_MODEL`.
- Local deterministic function builder is gated behind `STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER=true` and non-production environment.

## What is not proven

- No secret manager/runtime proof for `OPENAI_API_KEY`.
- No verified `STORYTIME_OPENAI_MODEL` in staging/production.
- No controlled OpenAI-backed generation test was run in this pass.
- No provider output receipt exists in this pass.
- No live provider failure/safety-block proof exists in this pass.

## Safety notes

Current prompt says to create family-safe private reflective sessions and not diagnose, shame, intensify fear, expose private personal details, or create public-share text. That is useful, but not sufficient by itself for child/minor production launch.

## Launch rule

Do not claim live AI generation. Safe wording: `OpenAI provider adapter is implemented but production generation remains gated until secrets, model, deployed Functions, controlled generation smoke test, and safety review are verified.`

## Required proof to upgrade

1. Configure provider secrets in staging without printing them.
2. Set `STORYTIME_GENERATION_PROVIDER=openai` and approved `STORYTIME_OPENAI_MODEL`.
3. Run controlled non-sensitive generation through deployed callable.
4. Confirm returned `provider` is `openai`.
5. Confirm Firestore bundle persists and excludes unsafe raw audit logging.
6. Confirm blocked/sensitive input fails safely.
7. Commit sanitized logs/screenshots.
