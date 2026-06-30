# Route map

## Public/product routes

| Route | Status | Classification | Notes |
|---|---:|---:|---|
| `/` | Not fully audited in this pass | UNKNOWN/PARTIAL | README says legacy demo entry may remain. |
| `/storytime` | Present | DONE/PARTIAL | Main Storytime home. Create form opens deterministic demo unless cloud/provider/client gates pass. |
| `/storytime/settings` | Present | GATED/PARTIAL | Read-only privacy/narrator settings copy. Not live persisted account settings. |
| `/storytime/demo` | Present through dynamic route | DONE/MOCK-DEMO | `generateStaticParams` includes `sessionId: demo`; deterministic local session, explicitly labeled demo. |
| `/storytime/[sessionId]` | Present | PARTIAL | Non-demo ids route to `CloudSession`; requires cloud mode, Firebase config, and signed-in user. |
| `/share/story/demo` | Present through dynamic route | DONE/MOCK-DEMO | Public-share shell only, explicitly labeled demo. |
| `/share/story/[shareId]` | Present | PARTIAL/GATED | Non-demo ids query `publicStoryShares` by slug when public sharing is configured. Handles revoked/expired/not-found/error. |

## Auth/account routes

No dedicated `/login` route found in this pass. Auth is embedded in `/storytime` through `AuthPanel` and uses Firebase email/password when client config is present.

## Admin/operator routes

No user-facing admin/operator review route was confirmed in this pass. Firestore rules include admin-only `moderation` and `auditLogs` access, but that is not the same as a production admin UI.

## API routes

No Next.js API route was confirmed in this pass. Backend lifecycle is Firebase callable Functions.

## Route launch boundary

Only the demo routes can be treated as locally usable without Firebase credentials. Non-demo story/share routes are production-shaped but must remain gated until Firebase Auth, Firestore, indexes, Functions, and public sharing gates are deployed and smoke-tested.
