# URAI Storytime

URAI Storytime is a privacy-first, family-safe storytelling web demo that turns a few parent inputs into gentle bedtime stories.

## Current launch status

**Status: Local Demo Preview.**

This repository currently ships a standalone static demo. Stories are generated locally and saved in the current browser only. Production cloud accounts, Firebase/Firestore persistence, paid billing, admin moderation, and wider URAI Labs integrations are **not launched** until verified by code, configuration, tests, deployment, and security review.

## Stack

- Vanilla HTML/CSS/JavaScript
- Node.js built-in HTTP server for local dev and preview
- Node test runner for smoke tests
- Static `dist/` build output

## Features in this build

- Public launch shell with Home, Features, Pricing, Demo, Create, Library, Safety, About, Contact, Privacy, Terms, Login, Signup, Dashboard, Admin, and Creator hash routes
- Local story generation engine
- Conservative demo prompt precheck
- Story library/history in `localStorage`
- Story detail/playback with Web Speech narration fallback
- Save/replay/delete/copy flows
- Local parent settings
- SEO basics: metadata, favicon, Open Graph SVG, robots.txt, sitemap.xml
- Mobile responsive UI
- Explicit disabled states for unlaunched auth, billing, admin, creator, and cloud dashboard features

## Not launched yet

- Real user accounts/auth
- Firebase/Firestore cloud persistence
- Firestore/Storage security rules
- Shared URAI Labs auth, analytics, admin, communications, privacy, content, or billing systems
- Paid subscriptions or entitlement enforcement
- Production-grade child safety/moderation
- Final legal privacy/terms/child-consent policy
- Verified deployment at `https://www.uraistorytime.com`

## Environment variables

See `.env.example`. This demo does not require secrets.

## Scripts

- `npm run dev` – run local server at `http://localhost:4173`
- `npm run build` – copy production files to `dist/`
- `npm run preview` – serve `dist/` after build
- `npm run test` – run Node tests
- `npm run test:smoke` – run smoke test
- `npm run test:e2e` – currently aliases smoke test
- `npm run lint` – custom lint script
- `npm run typecheck` – custom typecheck script
- `npm run format` – custom format check

## Local verification

```bash
npm ci
npm run build
npm run test
npm run test:smoke
npm run preview
```

Then manually verify:

1. Home page loads and shows URAI Storytime branding.
2. Nav links open all public routes.
3. Create generates a story.
4. Story detail renders and narration button behaves safely.
5. Library lists and deletes a created story.
6. Pricing clearly says billing is not launched.
7. Login/signup/dashboard/admin routes do not imply live auth.
8. Privacy, Terms, Safety, robots.txt, sitemap.xml, favicon, and Open Graph assets load.

## Deployment

Recommended target: Vercel, Netlify, Firebase Hosting, or any static host.

### Static deploy command

```bash
npm run build
```

Publish the `dist/` folder.

### Node preview command

```bash
npm run preview
```

## Done-done launch audit

See `docs/DONE_DONE_LAUNCH_AUDIT.md` for the strict launch contract, evidence matrix, route audit, tier audit, roadmap audit, URAI Labs integration audit, backend/security gaps, deployment checks, and final punch list.

## Security & privacy

- No secrets are required for the local demo.
- Demo mode stores data in browser `localStorage` only.
- Prompt safety filtering is a demo precheck, not a production moderation system.
- Do not collect real child-sensitive information in this build.
- Production launch requires verified auth, database rules, deletion/export, consent, safety review, and legal approval.
