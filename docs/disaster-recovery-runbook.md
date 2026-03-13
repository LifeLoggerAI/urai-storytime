
# Disaster Recovery Runbook

This runbook provides step-by-step instructions for recovering the Storytime application from a disaster scenario. A "disaster" is defined as an event that makes the application or its data unavailable or unusable, such as data corruption, catastrophic application failure, or a full regional outage.

---

## Scenario 1: Catastrophic Application Failure

**Symptom:** The production deployment is completely broken (e.g., all API endpoints return 500 errors, frontend does not load) due to a bad code push, and a simple rollback is not feasible.

**Objective:** Redeploy the last known stable version of the application from version control.

**Procedure:**

1.  **Identify Last Stable Commit:** The Incident Commander identifies the last known good commit hash from the `main` branch in the Git repository.
2.  **Create Recovery Branch:** A new branch (e.g., `hotfix/recovery-deploy`) is created from this stable commit.
3.  **Validate Environment:** The Technical Lead ensures the local environment is clean and checks out the new recovery branch.
4.  **Execute Production Deployment:** The TL runs the production deployment command from the recovery branch:
    ```bash
    firebase deploy
    ```
5.  **Verify Recovery:** The TL and IC perform a manual E2E test of the core user flows (login, create family, view story) to confirm the application is back in a stable state.

---

## Scenario 2: Data Corruption or Loss

**Symptom:** A significant amount of data in the production Cloud Firestore database has been corrupted or deleted.

**Objective:** Restore the Firestore database to a point in time before the corruption occurred.

**Prerequisite:** This scenario assumes that Point-in-Time Recovery (PITR) is enabled on the Cloud Firestore database, which is a standard best practice for production systems.

**Procedure:**

1.  **Identify Timestamp:** The Incident Commander, through log analysis, determines the exact timestamp *just before* the data corruption event occurred.
2.  **Initiate PITR:**
    *   The Technical Lead navigates to the Google Cloud Console -> Firestore -> "Databases" page.
    *   The TL initiates a restore operation to a *new target database* using the identified timestamp.
    *   **(CRITICAL):** The restore operation does *not* overwrite the live database. It creates a new one with the restored data.
3.  **Data Validation:** The TL writes and runs scripts to validate the integrity of the data in the newly restored database.
4.  **Cutover Strategy:** The IC and TL will determine the strategy for cutting over to the restored data. This may involve:
    *   A planned maintenance window.
    *   A background data migration from the restored DB to the live DB.
    *   The safest approach is often to bring the application down temporarily, swap the database configuration, and bring it back up.

---

## Scenario 3: Full Regional Outage

**Symptom:** Google Cloud reports a full outage for the region where the application is hosted.

**Objective:** Redeploy the application to a secondary region.

**Prerequisite:** This assumes a multi-region disaster recovery strategy has been planned for Firestore and other services.

**Procedure:**

1.  **Decision:** This is a major business decision. The Incident Commander will convene with leadership to get approval to fail over to the secondary region.
2.  **Configuration Update:** The Technical Lead will update the Firebase project configuration (`.firebaserc`) to point to a pre-configured secondary Firebase project in a different region.
3.  **Full Redeployment:** The TL will execute a full deployment to the new project:
    ```bash
    firebase deploy
    ```
4.  **DNS Update:** DNS records will be updated to point to the new hosting endpoint.
5.  **Verification:** The team will perform a full E2E validation of the application in the new region.
