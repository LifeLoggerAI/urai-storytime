# Internal Data Access Policy

## Principle: Minimum Necessary Access

Our guiding principle for internal data access is "Minimum Necessary Access." Team members should only have access to the data that is absolutely essential to perform their specific, authorized duties. Curiosity is not a valid reason for accessing user data.

### I. Access Levels

Access to production data is strictly controlled and tiered:

-   **Level 0 – No Access:** This is the default for most employees. They have no direct access to production Firestore or Storage data.

-   **Level 1 – Aggregated Metrics Only:** Access is restricted to anonymized, aggregated data for business intelligence purposes (e.g., total subscription counts, daily active users). This level has no access to any personally identifiable information (PII) or child-level data.

-   **Level 2 – Support Access (Temporary & Audited):** For specific customer support scenarios, access to an individual `familyId` may be granted. This access is:
    -   Time-limited (e.g., expires automatically after a few hours).
    -   Explicitly approved by a manager.
    -   Fully logged with the reason for access.

-   **Level 3 – Infrastructure Admin (Highly Restricted):** Reserved for a small number of DevOps and senior engineering personnel responsible for maintaining the production environment. This access requires Multi-Factor Authentication (MFA), and all actions are logged and subject to a mandatory quarterly audit by the URAI Foundation oversight committee.

### II. Strict Prohibitions

Under no circumstances are any employees, regardless of access level, permitted to:

-   Browse child stories or family data casually.
-   Access any user data out of personal curiosity.
-   Export or create local copies of user data from the production environment.
-   Use production data for any purpose outside of their direct, authorized job function (e.g., support, infrastructure maintenance).
-   Share screenshots or raw data from the production environment in public or semi-public forums (like Slack channels).

A violation of this policy is considered a major security and ethical breach and will result in immediate termination.

### III. Logging and Auditing Requirements

Every instance of Level 2 or Level 3 access to production data must be logged with the following information:

-   **Who:** The authenticated team member who accessed the data.
-   **When:** The precise timestamp of the access.
-   **Which Data:** The specific document path or `familyId` that was accessed.
-   **Duration:** The length of the access session.
-   **Reason:** A clear, mandatory justification for the access.

These logs are immutable and will be reviewed quarterly by the Foundation oversight committee to ensure compliance.