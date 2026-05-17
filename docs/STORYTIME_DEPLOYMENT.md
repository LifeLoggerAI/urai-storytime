# URAI Storytime Deployment

This branch upgrades URAI Storytime from the static local demo toward a Next.js + Firebase Storytime cloud architecture.

## What this deploys

- Next.js app routes for `/storytime`, `/storytime/[sessionId]`, `/storytime/settings`, and `/share/story/[shareId]`.
- Firebase Hosting config for framework hosting.
- Firestore rules and indexes for Storytime collections.
- Firebase callable functions for Storytime generation, public shares, narrator scripts, emotional arcs, weekly scrolls, voiceover hooks, timeline refresh, and archive rebuild.
- Storytime TypeScript domain models and safety/redaction helpers.
- Asset-Factory adapter hook for future media generation jobs.

## Required environment variables

Copy `.env.example` and set real values for staging or production:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

STORYTIME_CLOUD_MODE=false
STORYTIME_PUBLIC_SHARING=false
ASSET_FACTORY_BASE_URL=
ASSET_FACTORY_API_KEY=
OPENAI_API_KEY=
```

## Local install

```bash
npm install
npm run typecheck
npm run build

cd functions
npm install
npm run build
cd ..
```

## Firebase setup

```bash
firebase login
firebase use <project-id>
firebase emulators:start
```

## Deploy order

Deploy rules before cloud UI is used:

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
firebase deploy --only hosting
```

Or full deploy:

```bash
npm run build
firebase deploy
```

## Post-deploy smoke test

1. Visit `/storytime`.
2. Visit `/storytime/settings`.
3. Visit `/storytime/demo-session`.
4. Visit `/share/story/demo-share`.
5. Confirm no page claims diagnosis, therapy, passive sensing, child compliance, or public sharing without consent.
6. Confirm Firebase callable functions deploy successfully.
7. Confirm Firestore rules deploy before writing story data.

## Rollback

```bash
firebase hosting:releases:list
firebase hosting:rollback
```

If Functions cause issues, redeploy the previous known-good functions bundle or disable cloud mode by setting `STORYTIME_CLOUD_MODE=false`.

## Known launch boundary

This branch wires the architecture and callable hooks. It does not by itself verify production Firebase credentials, domain DNS, billing, real AI provider generation, real TTS, or Asset-Factory production credentials. Those must be configured and smoke-tested per environment before public launch claims are made.
