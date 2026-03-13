
# Backup Restore Validation Procedure

This document provides the specific checklist for validating a restored Cloud Firestore database. This procedure is executed after a Point-in-Time Recovery (PITR) operation has been completed, as outlined in the Disaster Recovery Runbook.

---

## 1. Initial State

*   **Assumption:** A Cloud Firestore PITR operation has been successfully completed.
*   **Result:** A new, secondary Firestore database now exists containing the restored data.
*   **State:** The live application is still connected to the original (potentially corrupted) database. The restored database is offline and not serving traffic.

## 2. Validation Team

*   **Technical Lead (TL):** Responsible for executing the technical validation steps.
*   **Incident Commander (IC):** Responsible for overseeing the validation and making the final decision on the viability of the restored data.

## 3. Validation Checklist

### Step 1: Schema Validation

*   **Objective:** Ensure the restored data adheres to the expected schema and structure.
*   **Action:** The TL will manually inspect a sample of documents in the restored database using the Google Cloud Console.
*   **Checklist:**
    *   [ ] `families` collection: Documents contain an `ownerUid` (string).
    *   [ ] `children` sub-collection: Documents contain a `name` (string).
    *   [ ] `stories` sub-collection: Documents contain a `theme` (string) and `status` (string).

### Step 2: Data Integrity Validation (Automated)

*   **Objective:** Programmatically verify key relationships and counts within the restored data.
*   **Action:** The TL will write and execute a temporary script that connects directly to the restored database.
*   **Checklist:**
    *   [ ] **Ownership Check:** Run a query to confirm that for a sample of `stories`, the `ownerUid` on the parent `family` document is correctly linked.
    *   [ ] **Count Verification:** Run a query to get a total count of documents in the `families` collection. Does this number align with expectations for the restore point?
    *   [ ] **Content Spot-Check:** For a known user account, query their data in the restored database. Does it match the expected state at the time of the backup?

### Step 3: Functional Validation (Manual E2E)

*   **Objective:** Perform a live, end-to-end test against the restored data.
*   **Action:** The TL will temporarily reconfigure a local development environment to point the backend API to the restored database.
*   **Checklist:**
    *   [ ] **Authentication:** Can the TL log in as a test user that is known to exist in the restored data?
    *   [ ] **Read Operation:** After logging in, does the frontend correctly load the user's family and child data from the restored database?
    *   [ ] **Write Operation (Simulated):** Attempt to generate a new story for the user. Verify that the new `story` document is created correctly within the restored database. *Note: This write operation will be discarded along with the temporary database.*

## 4. Sign-off

*   **Decision:** If all checklist items above are successfully verified, the Incident Commander will declare the restored database as **VALIDATED**.
*   **Next Steps:** With a validated backup, the team can proceed with the data cutover strategy outlined in the Disaster Recovery Runbook.
*   **Failure:** If any validation check fails, the IC will declare the backup as **INVALID**. The team must investigate the cause of the failure. This may involve selecting an earlier restore point or escalating the issue if the backups themselves are compromised.
