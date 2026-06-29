# URAI Storytime release evidence template

Timestamp: 2026-06-29T0000Z

Use this folder as the exact evidence target for the first real staging or production release.

## Release identity

- Repository:
- Commit SHA:
- Environment: staging or production
- Firebase project id:
- Hosting URL:
- Operator:
- Started at:
- Completed at:

## Build proof

Paste command output or link CI artifact for each item.

- Root dependency install:
- Functions dependency install:
- Typecheck:
- Unit and smoke tests:
- App build:
- Functions build:
- Production config validation:

## Firebase proof

- Firebase project exists:
- Hosting enabled:
- Functions enabled:
- Firestore enabled:
- Storage enabled:
- Auth enabled:
- Email/password auth provider enabled:
- Firestore rules deployed:
- Firestore indexes deployed:
- Storage rules deployed:
- Functions deployed:
- Hosting deployed:

## Provider proof

- Provider configured:
- Model configured:
- Secret stored outside source control:
- Provider response tested:
- Provider output safety reviewed:

## Live smoke proof

- Home route loaded:
- Demo route loaded:
- Settings route loaded:
- Account created:
- Signed in:
- Cloud story created:
- Saved story loaded:
- Public share created:
- Public share opened:
- Public share revoked:
- Revoked share blocked:

## Screenshots

Save screenshots in this folder using these names:

- 01-home.png
- 02-demo-story.png
- 03-auth-signed-in.png
- 04-cloud-story-created.png
- 05-saved-story-loaded.png
- 06-public-share.png
- 07-revoked-share-blocked.png

## Approval proof

- Privacy approval:
- Legal approval:
- Child/family safety approval:
- Provider prompt/output approval:
- Data retention/delete/export approval:

## Final verdict

Choose one:

- PRODUCTION READY
- LIVE BUT PARTIAL
- DEPLOYMENT READY BUT BLOCKED BY ACCESS
- NOT READY

Final notes:
