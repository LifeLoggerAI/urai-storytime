# Architectural Decision Log: Frontend Convergence

## Decision
The repository will be converged to a single, authoritative frontend.

- **Intended Survivor**: The **root Next.js application** (located in `app/`) is the designated survivor. All future development will occur here.
- **Donor/Reference**: The **`storytime-app`** directory is now considered a read-only reference. Its code (specifically for authentication) will be ported to the root app. It is not to be developed further.

## Mandate
No cleanup (archiving or deletion) of the `storytime-app` directory will occur until the root app has successfully integrated authentication, proven an end-to-end story generation/playback flow, and has been successfully deployed to Firebase Hosting, replacing the old target.

This log freezes the decision and supersedes all previous architectural ambiguity.
