# R902 — Current private-list actor lease and account switch boundary

**Status:** isolated source fix, exact-head native CI/emulator/browser **PENDING**, production HOLD. Parent: unmerged PR #97 at `312240f5da9042a2cc9d11dac179bed90dee51d1`. No changes to PRs #83/#96/#97/#99/#100, main or Firebase production.

## Concrete source-level issue

Previous `SessionLibrary.tsx` and `DraftLibrary.tsx` used `let active=true` to protect cleanup after component unmount, but did **not** distinguish overlapping Firebase Auth change callbacks **while the same component remains mounted**. Example: a query started under account A; account B signs in, starts another query; A's pending `getDocs` finishes after B and may call `setState(ready, A's records)`. On the shared browser, content for the previous signed-in account could be displayed in the newer account UI. The issue can also occur for a new Firebase User object carrying the same UID after account recreation, unless current identity is object- and epoch-bound. Firestore Rules still prevent account B from initiating a new unauthorized read; the issue concerns **stale already-fetched client data in React state**, not direct cross-account database access. Actual live exploitation is **not proven**.

`CloudSession.tsx` already has an exact User object + auth epoch settlement guard; `PrivacyRequestControls.tsx` already uses `privacy-actor-lease.ts`. This patch brings the two list components into alignment rather than creating another architecture.

## Focused correction

- New `src/lib/storytime/current-account-lease.ts` pure TypeScript helper captures actor object + auth event generation and checks the live actor and epoch.
- In both libraries: increment epoch for each Auth notification and on unmount; capture lease before asynchronous Firestore query; clear previous state when a new actor loads; require current lease at success and error settlement.
- Bind ready state to exact `User` object and deny rendering immediately on a different `auth.currentUser`, including identical UID but a newly created User object.
- Preserve Firestore ownerUid filters, accessible loading statuses, existing query limits, and existing behavior for signed-out and cloud-mode-off accounts.
- Add `tests/unit/storytime-current-account-lease.test.mjs` with synthetic object-switch, same-UID new object, epoch invalidation, null actor and source assertions. The suite uses Node's `stripTypeScriptTypes`, matching existing tests. **Not executed yet.**

## Evidence classification

GitHub connected source read proves previous missing checks and new committed source; no network clone (github.com DNS unavailable in local container), frozen npm install, real Auth provider, real Firestore emulator, screenshot or authenticated browser completed in this session. GitHub Actions runner/account failures continue at PR #97/#99/#100; no green exact-head certificate exists for this child. Production, paid provider, user records and cloud IAM remain untouched.

## Required review and acceptance

Run exact-head Node22 root tests/typecheck/Next build, focused helper unit tests, dual-user Firebase Auth+Firestore emulator browser integration; assert no owner-A title/draft metadata shown after switch to B; same-UID recreation fixture; stale success and stale error after new user's ready state; signout while pending; unmount while pending; preserve screen-reader loading/empty statuses. Only after independent review and CI green consider merging into the current engineering owner lane.

The contents of synthetic drafts are not recorded facts or privileged source permits; this patch affects display isolation, **not** truth classification or source-to-story authorization. Production HOLD.
