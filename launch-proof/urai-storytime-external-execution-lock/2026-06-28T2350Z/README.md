# URAI Storytime external execution lock

Timestamp: 2026-06-28T2350Z

## Current status

The repository has deployment-ready wiring, safety gates, auth UI, cloud session hydration, public share lifecycle, provider wiring, CI production gates, and deployment runbooks.

The remaining blockers require external execution outside source control. They cannot be completed by editing repository files alone.

## External items that must be completed in Firebase or provider consoles

1. Real Firebase project
   - Select or create staging project.
   - Select or create production project.
   - Replace `.firebaserc` placeholder with real project ids.
   - Enable Hosting.
   - Enable Functions.
   - Enable Firestore.
   - Enable Storage.
   - Enable Auth.

2. Deploy credentials
   - Configure deployment credentials in the CI environment.
   - Confirm deploy permission for Hosting, Functions, Firestore rules/indexes, and Storage rules.

3. Provider secrets
   - Configure story provider secret outside source control.
   - Configure model name outside source control.
   - Keep public provider-ready flags false until staging proof passes.

4. Build and test proof
   - Run dependency install.
   - Run typecheck.
   - Run tests.
   - Run app build.
   - Run functions build.
   - Save logs under launch-proof.

5. Staging deploy proof
   - Deploy Firestore rules and indexes.
   - Deploy Functions.
   - Deploy Hosting.
   - Save deploy logs under launch-proof.

6. Live smoke proof
   - Open staging URL.
   - Verify Storytime home renders.
   - Verify demo route renders.
   - Create account.
   - Create cloud story.
   - Load saved hydrated story.
   - Create public-safe share.
   - Open public-safe share URL.
   - Revoke public share.
   - Confirm revoked share is blocked.
   - Save screenshots/logs under launch-proof.

7. Approval proof
   - Privacy approval.
   - Legal approval.
   - Child/family safety approval.
   - Provider output safety review.

## Final production promotion rule

Do not claim PRODUCTION READY or LIVE until all external execution items above are completed with proof.

## Repo-side completion state

The codebase is prepared to fail closed when these external requirements are missing. Production claims remain blocked until actual build, deploy, smoke, and approval evidence is present.
