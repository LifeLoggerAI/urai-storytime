# Build & Deploy Ground Truth

This document contains only verifiable facts about the repository's build, deploy, and runtime configuration. It is the locked source of truth for the frontend convergence plan.

---

### 1. Default Local Build Target
- **Target**: The root Next.js application (`app/`).
- **Reasoning**: The root `package.json` contains the script `"build": "next build && next export"`.

### 2. Default Deployed Hosting Target
- **Target**: `storytime-app/out`
- **Reasoning**: The `firebase.json` configuration explicitly sets `"hosting": { "public": "storytime-app/out" }`.

### 3. Exact Command that Generates Deployed Output
- **Command**: **Unverified**.
- **Reasoning**: This command is not present in any repository configuration file.

### 4. Frontend Containing Auth UI
- **Frontend**: `storytime-app`
- **Reasoning**: Contains a functional Firebase client and login component.

### 5. Frontend Containing Playback UI
- **Frontend**: **Neither** (in a functional state).
- **Reasoning**: The root app has a non-functional placeholder; `storytime-app` has no identifiable playback component.

### 6. Chosen Canonical Frontend
- **Frontend**: **The root Next.js application (`app/`)**.
- **Reasoning**: As per `DECISION_LOG.md`, this is the designated survivor to ensure a single, authoritative frontend pipeline.

---

### Evidence Files Reviewed
- `package.json`
- `firebase.json`
- `storytime-app/package.json`
- `storytime-app/src/lib/firebase.ts`
- `storytime-app/src/components/Login.tsx`
- `app/page.tsx`
- `.github/workflows/` (confirming absence)
