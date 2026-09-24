# Legacy static Storytime demo

The former static/hash-router entrypoints are intentionally not retained as runnable files in the current tree.

Historical versions of `src/index.html`, `src/app.js`, and `src/styles.css` remain available through Git history before commit `ab89a95137a048fdd669e36485ed2dd6cef6d146` and its follow-up deletion commits.

The old deterministic bedtime-demo engine is retained here as `legacy/static-demo/story-engine.mjs` solely for historical/unit-test evidence. Its child-name bedtime semantics, substring moderation, and local-demo provider identity are **not** current Storytime product authority.

This directory must not contain an HTML entrypoint, package manifest, Hosting configuration, deployment workflow, or executable preview command.

Canonical application authority is documented in `docs/CANONICAL_APP_ROOT.md` and remains the Next.js/Firebase app under `src/app`, `src/components/storytime`, `src/lib`, and `functions/src`.
