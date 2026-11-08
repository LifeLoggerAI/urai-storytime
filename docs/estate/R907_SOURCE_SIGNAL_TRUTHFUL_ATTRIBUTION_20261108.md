# R907 — Storytime source-signal attribution and privacy-safe explanations

**Classification:** Source-level provenance correction, focused native partial verification, production HOLD. November 8, 2026 Central.

## Source ancestry and exact scope
- Source branch `review/chalk-storytime-source-signal-provenance-r907-20261108` starts from **PR #104** `94022314d331cac68fe48e93d52f438a12c1e96d`. No other worker branch, production Firebase, user memory, provider or billing was changed.
- Backend `functions/src/storytime.ts` Git blob **809154cc65156e54e209292e8df87bdbd1074803**.
- Local explanatory helper `src/lib/storytime/redaction.ts` Git blob **4a0e97ed2d6d0c8798ed8ff25b40895d2e8136ae**.
- New regression suite `tests/unit/storytime-source-signal-provenance.test.mjs` Git blob **b2eeb68be5928378588e1fed84b136fcd967b019**.

## Proven source/provenance discrepancy
The old Storytime generation backend wrote a user-visible `whyGenerated` string saying the story was generated from `input.sourceSignals.join(', ')`. But `providerInputFromRequest` passes title, **sourceText**, emotional tone, motifs, locale and audience — **not sourceSignals** — to `functions/src/story-provider.ts`; the deterministic fallback likewise does not read the sourceSignals array. The local `buildStorySession` uses `sourceSignals` for the session metadata and explanation only. No resolved and authenticated UrAi memory graph artifact/record is fetched by either of these inspected paths. Consequently the old explanation both misattributed creative text to unused labels and echoed potentially sensitive user-entered labels into StoryPlayer's UI. The sourceSignals array itself remains recorded as client-submitted context, **not verified evidence**.

## Focused correction
- Both explanations now state that Storytime used submitted inputs to form a **creative reconstruction**; source labels are **saved as unverified context, not used as narrative sources**, and no original-memory source verification is claimed.
- The explanation no longer interpolates the contents of `sourceSignals` into user-facing text.
- Actual source processing, provider request payload, original story session schema, source label storage, generation charge/provider gates, consent flags, and existing historical records remain untouched.
- The current StoryPlayer displays the saved `whyGenerated` field. Newly created sessions get corrected copy; existing records with historical inaccurate text require separate consent-safe read/migration or provenance UI handling. No automatic existing-private-record migration performed.

## Test evidence
- The original 974-byte `redaction.ts` source was reconstructed exactly, verified against GitHub's **Git blob SHA-1 4a0e97ed2d6d0c8798ed8ff25b40895d2e8136ae**; its raw SHA-256 is **d21b5a7b84ed6564f5108c43f0b065b02d71e430101e1b8eafb88d214bde1953**.
- Node 22.16.0 with `stripTypeScriptTypes` executed **two focused helper assertions, 2/2 PASS**: absent signals do not assert verified memory; sensitive signal labels are omitted and explicitly distinguished from narrative generation. These are original-source function checks, not a complete project run.
- `tests/unit/storytime-source-signal-provenance.test.mjs` contains **four** tests (both runtime explanation checks and two source-contract tests) committed for native suite execution, but **the four-test file was not executed as a suite**. Its backend/provider/builder assertions were statically reviewed against GitHub source only.
- GitHub Actions on prior branches fail without usable execution steps; container DNS cannot clone `github.com`. No Firebase Auth/Firestore/Functions emulator, Next/Functions build, protected live user story, paid OpenAI call, device or production deployment was verified.

## Risks and remaining P0–P3
P0: Ensure owner-specific consent and actual memory graph provider/resolver are independently verified before claiming recorded memory use; do not silently upgrade labels to source evidence. Check that the correction and `whyGenerated` labels cannot be forged by client writes; PR #100 is still an unmerged server-write rules remediation.

P1: Source-to-claim ledger for all generated statements including recorded original artifact hash, recollector attribution, creative interpretation, contradictions and owner correction history. Determine what to do about existing saved `whyGenerated` inaccuracies with private owner consent, without changing original creative versions.

P2: Browser accessibility and provenance copy review; verify English-only current scope and do not imply 20 live locales.

P3: Preserve original 2024-dated child StoryTime policy restrictions and all historical branch/asset inventories in PR #99. No new historical or off-Git media bytes were accessed in this fix.

**Remembered testimony ≠ recorded source ≠ AI-generated interpretation. Production HOLD.**
