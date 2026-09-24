# Archived static Storytime demo

This directory contains historical Storytime prototype code retained only for regression/history purposes.

It is **not** a production or launch runtime.

Canonical Storytime runtime authority is:

- `src/app/**`
- `src/components/storytime/**`
- `src/lib/storytime/**`
- Firebase callable Functions under `functions/src/**`

The archived `story-engine.mjs` uses a local deterministic template and historical child-name/demo semantics. It is retained only so historical behavior can remain covered by a unit test. It must not be imported by production application code, deployment scripts, provider adapters, or current product policy.

The former static/hash-router HTML/application entrypoints are not retained as runnable files in the current tree. Historical versions remain available through Git history.

This directory must not gain a Hosting target, deployment workflow, package entrypoint, or production import path.
