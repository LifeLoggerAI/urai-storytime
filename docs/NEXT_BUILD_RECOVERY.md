# Next.js Build Recovery Notes

These notes document the build failure reported from a local checkout that appears to contain a Next.js app while the connected GitHub repository currently exposes a vanilla static app on `main`.

## Reported local errors

```text
./src/pages/ParentDashboard.js
Module not found: Can't resolve '../context/AuthContext'

app/layout.tsx
An error occurred in `next/font`.
Error: Cannot find module 'autoprefixer'

npm error Missing script: "test"
npm error Missing script: "test:smoke"
npm error Missing script: "preview"
```

## Repo mismatch warning

The connected GitHub branches available during this audit did not contain these local Next.js files:

```text
src/pages/ParentDashboard.js
app/layout.tsx
```

The open PR therefore adds compatibility/fallback pieces, but the exact failing Next app cannot be fully patched or verified until the local Next.js checkout is pushed to the repository/branch that CI can read.

## Compatibility fixes added in this PR

- `src/context/AuthContext.js` provides a demo-safe `AuthProvider` and `useAuth` fallback.
- `postcss.config.js` loads `autoprefixer`.
- `package.json` includes `autoprefixer`, `postcss`, and a `validate` script.
- `.github/workflows/validate.yml` runs `npm ci` and `npm run validate` in CI.

## Required fix if the local app is Next.js

If your actual app is Next.js, verify `package.json` includes scripts equivalent to:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "preview": "next start",
    "lint": "next lint",
    "test": "next lint",
    "test:smoke": "npm run build",
    "validate": "npm run lint && npm run build && npm run test:smoke"
  }
}
```

For static export with modern Next, prefer `output: 'export'` in `next.config.js` or `next.config.mjs` instead of `next export`.

Example:

```js
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

## AuthContext import check

If a page imports:

```js
import { useAuth } from '../context/AuthContext';
```

then this file must exist relative to that page:

```text
src/context/AuthContext.js
```

If the project uses path aliases, prefer one source of truth:

```js
import { useAuth } from '@/context/AuthContext';
```

and verify `jsconfig.json` or `tsconfig.json` maps `@/*` correctly.

## Layout provider check

If `app/layout.tsx` renders pages that depend on auth context, wrap children with `AuthProvider`.

Example:

```tsx
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

If the import path differs in your repo, adjust it to the actual relative path or alias.

## Clean local verification

```bash
rm -rf .next out node_modules package-lock.json
npm install
npm run build
npm run test
npm run test:smoke
npm run preview
```

## Security warning

The reported install log said `next@14.2.3` has a security warning. Upgrade to a patched Next.js version before production launch. Use the latest compatible version for your project and re-run the full validation suite.

## Done condition

This issue is not done until:

- The exact Next.js branch is pushed.
- CI runs on that branch.
- `npm ci` passes.
- `npm run build` passes.
- `npm run test` exists and passes.
- `npm run test:smoke` exists and passes.
- `npm run preview` exists and starts a production build successfully.
