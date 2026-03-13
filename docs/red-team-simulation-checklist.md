
# Red-Team Simulation Checklist

This document provides a checklist for conducting a red-team exercise against the live Storytime application. The objective is to simulate real-world attacks and verify that the implemented security controls are effective in a production environment.

---

## Rules of Engagement

*   **Scope:** The simulation is limited to the production application endpoints and database.
*   **Exclusions:** Do not perform volumetric DDoS attacks. The goal is to test application logic, not Google's infrastructure resilience.
*   **Accounts:** The red team will be provided with two separate, standard user accounts created via the normal sign-up process.
    *   `Attacker Account`
    *   `Victim Account`

---

## Test Case 1: Cross-Tenant Data Access (Information Disclosure)

*   **Objective:** Verify that the `Attacker` cannot read or list data belonging to the `Victim`.
*   **Setup:** The `Victim` user must have at least one family, one child, and one story created.
*   **Procedure:**
    1.  [ ] As the `Attacker`, authenticate and obtain a valid JWT.
    2.  [ ] Using a tool like `curl` or Postman, attempt to call the `getStoryPlaybackDetails` function using the `Attacker`'s JWT but with the known `familyId` and `storyId` of the `Victim`.
    3.  [ ] Attempt to call the (undocumented) `getChildren` function with the `Victim`'s `familyId`.
*   **Expected Result:** All API calls must fail with an authentication/authorization error (e.g., HTTP 403 Forbidden or a clear "permission denied" message). The API must not return any of the `Victim`'s data.

## Test Case 2: Cross-Tenant Data Modification (Tampering)

*   **Objective:** Verify that the `Attacker` cannot create, modify, or delete data within the `Victim`'s family.
*   **Setup:** The `Victim` user must have at least one family created.
*   **Procedure:**
    1.  [ ] As the `Attacker`, authenticate and obtain a valid JWT.
    2.  [ ] Attempt to call the `createChild` function using the `Attacker`'s JWT but providing the `familyId` of the `Victim`.
    3.  [ ] Attempt to call the `generateStory` function using the `Attacker`'s JWT but providing the `familyId` of the `Victim`.
*   **Expected Result:** All API calls must fail with an authentication/authorization error. No new documents should be created under the `Victim`'s family.

## Test Case 3: Direct Storage Access (Information Disclosure)

*   **Objective:** Verify that it is impossible to access assets in Cloud Storage without a valid, user-specific signed URL.
*   **Setup:** The `Victim` must have a story with an associated audio file.
*   **Procedure:**
    1.  [ ] As the `Victim`, call `getStoryPlaybackDetails` to obtain a legitimate signed URL for an audio file.
    2.  [ ] Analyze the structure of the signed URL. Note the path to the file within the bucket.
    3.  [ ] As the `Attacker` (or an unauthenticated user), attempt to construct and access the direct URL to the asset (i.e., `https://storage.googleapis.com/{bucket-name}/{file-path}`).
    4.  [ ] As the `Attacker`, attempt to reuse the `Victim`'s signed URL after it has expired.
*   **Expected Result:** All direct access attempts must fail with an XML error indicating "Access Denied". The expired URL must also fail.

## Test Case 4: Privilege Escalation

*   **Objective:** Verify that there are no hidden administrative functions.
*   **Procedure:**
    1.  [ ] Scan the application for any undocumented API endpoints.
    2.  [ ] Attempt to call functions with names like `admin`, `getUsers`, `deleteFamily`, `updateStory`.
*   **Expected Result:** All such attempts should result in either a "function not found" error or an authorization failure. The system should not expose any administrative capabilities to standard users.
