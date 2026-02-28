
# URAI-Storytime: Threat Model v1.0

This document outlines the threat model for the URAI-Storytime V1 platform. It identifies potential threat actors, attack surfaces, and the primary mitigations in place to protect the system.

### Threat Actors

1.  **Curious Authenticated Parent:** A legitimate user who may attempt to access data outside of their own family scope (e.g., by guessing document IDs).
2.  **Malicious Authenticated User:** A legitimate user who actively tries to exploit the system to gain unauthorized access, bypass billing, or disrupt the service.
3.  **External Attacker:** An unauthenticated party attempting to breach the system from the outside via public endpoints.
4.  **Insider (Employee):** A team member who intentionally or unintentionally misuses their legitimate access privileges.
5.  **Automated Bot:** A script designed to spam the service, attempt credential stuffing, or probe for vulnerabilities.

### Attack Surfaces

-   **Firestore API:** Direct interaction with the database from the client for reads and limited, controlled writes.
-   **Cloud Functions (`generateStory`):** The primary server-side endpoint for core application logic.
-   **Stripe Webhook Endpoint:** The public endpoint that receives billing events from Stripe.
-   **Cloud Storage (Signed URLs):** The mechanism for delivering private audio and image content.
-   **Admin Console:** The Firebase/Google Cloud console used by internal team members.

### Primary Threat Categories & Mitigations

#### A. Cross-Family Data Access

-   **Threat:** A user gains access to another family's data.
-   **Mitigation:**
    1.  **DB Structure:** All user data is strictly nested under a unique `familyId`. This is the foundational layer of data isolation.
    2.  **Firestore Rules:** Server-side rules (`firestore.rules`) enforce that a user's UID must match the `ownerUid` on the family document they are trying to access. This prevents any user from reading or writing to another family's data, even if they guess the `familyId`.
    3.  **Function Validation:** The `generateStory` Cloud Function independently re-validates family ownership before executing any logic. This provides defense-in-depth, ensuring that even if a Firestore rule were misconfigured, the backend logic would still prevent unauthorized access.

#### B. Billing Bypass

-   **Threat:** A user accesses premium features without a valid subscription.
-   **Mitigation:**
    1.  **Server-Side State:** The official subscription status is stored server-side in Firestore and is considered the source of truth for access rights.
    2.  **Webhook Verification:** The Stripe webhook handler cryptographically verifies the signature of every incoming event to ensure its authenticity.
    3.  **Client Cannot Write:** Firestore rules prevent the client from modifying the `billing` object within a family document.

#### C. Data Exfiltration

-   **Threat:** An attacker gains bulk access to story assets (audio/images).
-   **Mitigation:**
    1.  **Private Storage:** The Cloud Storage bucket is not public. `storage.rules` deny all direct read attempts.
    2.  **Short-Lived URLs:** All content is delivered exclusively via signed URLs that automatically expire after 24 hours, preventing permanent links from being shared or abused.

#### D. Insider Misuse

-   **Threat:** An employee accesses user data for unauthorized purposes.
-   **Mitigation:**
    1.  **Role-Based Access Control (RBAC):** We enforce a strict, tiered `Internal Data Access Policy`.
    2.  **Audited Sessions:** All administrative access is time-limited, logged, and subject to mandatory quarterly audits.
    3.  **Principle of Least Privilege:** Employees are granted the absolute minimum level of access required to perform their duties.

#### E. Injection Attacks

-   **Threat:** An attacker attempts to inject malicious data or prompts into the system.
-   **Mitigation:**
    1.  **Template Whitelist:** The `generateStory` function only allows the creation of stories from a hardcoded, server-side list of approved `templateId`s. Any other ID is rejected.
    2.  **No Raw Input:** The function does not accept any raw, user-generated text for story prompts, completely avoiding prompt injection vulnerabilities.
