# URAI Storytime

URAI Storytime is a privacy-first, family-safe storytelling web app that turns a few parent inputs into magical bedtime stories.

## Stack
- Vanilla HTML/CSS/JavaScript (no runtime dependencies, offline-friendly)
- Node.js built-in HTTP server for local dev and preview
- Node test runner for unit + smoke tests

## Features
- Beautiful home/landing with magical tone
- Onboarding via guided "Create Story" form
- Child-safe moderation guardrails (`violence`, `blood`, etc. blocked)
- Narrator and mood selection
- Story generation flow with local demo engine
- Story library/history (localStorage)
- Story detail/playback with Web Speech narration
- Save/replay/regenerate/delete/share (copy)
- Parent settings with privacy defaults
- Empty/error states for library and missing stories
- Mobile responsive UI

## Environment variables
See `.env.example`.

## Scripts
- `npm run dev` – run local server at `http://localhost:4173`
- `npm run test` – run unit tests
- `npm run test:smoke` – run E2E smoke test
- `npm run build` – copy production files to `dist/`
- `npm run preview` – serve `dist/`

## Deployment
Recommended target: **Vercel, Netlify, or any static host**.

### Static deploy command
```bash
npm run build
```
Then publish the `dist/` folder.

### Node preview command
```bash
npm run preview
```

## Smoke checklist
1. Home page loads and shows URAI branding.
2. Navigate to Create and generate story.
3. Story detail page renders with narration button.
4. Library page lists created story.
5. Delete from library works.
6. Settings page accessible.

## Security & Privacy
- No secrets in repository.
- Demo mode stores data in browser localStorage only.
- Prompt safety filter blocks disallowed harmful terms.
- No sensitive content logging.
