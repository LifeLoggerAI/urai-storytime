# URAI Storytime live deployment execution

This file is the operational checklist for moving Storytime from deployment-ready code to live production proof.

## Required external setup

- Create or select the Firebase staging project.
- Enable Firebase Hosting.
- Enable Cloud Functions for Firebase.
- Enable Firestore.
- Enable Cloud Storage for Firebase.
- Enable Firebase Authentication with email and password sign-in.
- Configure story generation provider secrets outside source control.
- Record privacy, legal, and child safety approval evidence.

## Required execution sequence

1. Install root dependencies.
2. Install Functions dependencies.
3. Run typecheck.
4. Run tests.
5. Run app build.
6. Run Functions build.
7. Run production config validation.
8. Deploy Firestore rules and indexes.
9. Deploy Functions.
10. Deploy Hosting.
11. Open the staging URL.
12. Smoke test Storytime home.
13. Smoke test demo route.
14. Create a Firebase account.
15. Create a cloud story.
16. Load saved story route.
17. Create public-safe share.
18. Open public-safe share route.
19. Revoke public share.
20. Confirm revoked share blocks public story text.
21. Save logs and screenshots under launch-proof.

## Production rule

Do not promote to production until staging completes every step above with recorded proof.
