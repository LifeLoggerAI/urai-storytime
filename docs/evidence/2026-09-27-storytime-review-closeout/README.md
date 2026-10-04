# Storytime review closeout

Parent: PR57 at c89be89dbf6a2dc9748d5a5063d92f287a509e36. Three still-current automated review findings were checked against source and repaired without changing provider activation or spending.

- Protected deployment and rollback validation now receive the seven existing environment-owned spend/pricing/budget/output settings. No values are invented or authorization enabled. The regression executes the actual offline configuration validator using fixture values and proves false spend authorization still fails.
- Added the owner/updatedAt descending composite index used by archive rebuild, preserving the createdAt index. The index is source-defined, not deployed.
- A final persistence failure now triggers transactional readback. A matching owned successful request/session proves a lost acknowledgement; otherwise a metadata-only dead letter and terminal request hold prevent automatic same-ID regeneration. Settled budgets and already-successful request state are preserved. No raw story content or provider error is put in the dead letter. If Firestore is unavailable, the processing claim remains the retry barrier and the response reports unconfirmed persistence. Manual reconciliation is still required; this is not automatic result recovery.

Validation: three configuration/index regressions failed on the parent and pass after repair; eight persistence regressions pass; full unit/e2e suite175/175 passes; root TypeScript and Functions build pass; workflow YAML parses and whitespace check passes. Initial full-suite invocation before installing root dependencies could not load TypeScript and found three obsolete untracked clone files; those files were moved outside the checkout before the successful suite and are excluded from this commit. Logs retain the successful run. Local Node24; Functions declares Node22, so CI remains required.

No live provider request, database write, index deployment, protected workflow dispatch, cloud mutation, independent approval, merge or production certification occurred. Paid-provider staging lifecycle, exact-head CI/review, protected deployment and public acceptance remain open.
