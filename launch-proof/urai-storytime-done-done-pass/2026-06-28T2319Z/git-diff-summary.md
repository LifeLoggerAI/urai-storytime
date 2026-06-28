# Git diff summary

Timestamp: 2026-06-28T2319Z

Baseline: `13c7e6adc834c2ced023a0c54e7ca5b914f4fe46`
Head before proof docs: `efaf6c752a5709ac346a5336ce536acefafc2af8`

## Changed before proof docs

`main` was ahead of the baseline by 24 commits before this proof folder was added.

Files changed from baseline before proof docs:

- `.env.example`
- `functions/src/story-provider.ts`
- `functions/src/storytime.ts`
- `scripts/validate-env-template.mjs`
- `src/app/globals.css`
- `src/app/share/story/[shareId]/page.tsx`
- `src/app/storytime/[sessionId]/page.tsx`
- `src/components/storytime/CloudSession.tsx`
- `src/components/storytime/SessionLibrary.tsx`
- `src/components/storytime/ShareStory.tsx`
- `src/components/storytime/StorytimeHome.tsx`
- `src/lib/firebase/client.ts`
- `src/lib/storytime/runtime-config.ts`
- `src/lib/storytime/server-session-store.ts`
- `tests/e2e/smoke.test.mjs`
- `tests/unit/env-template-validation.test.mjs`

## Implementation categories

- Runtime gates and env validation.
- Lazy Firebase client initialization.
- Cloud/demo-aware story creation UI.
- Real-capable saved session route.
- Gated session library UI.
- Real-capable public share route.
- Provider wrapper for OpenAI JSON output.
- Fail-closed production generation behavior.
- Updated smoke/env tests for route/config/provider truth.
- Proof folder and launch evidence.
