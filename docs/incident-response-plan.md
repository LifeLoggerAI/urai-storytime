
# Incident Response Plan

This document outlines the procedure for responding to security incidents affecting the Storytime application. Given the serverless nature of the application, the plan focuses on incidents at the application layer, such as data breaches, and relies on Google Cloud for infrastructure-level incidents.

---

## 1. Roles & Responsibilities

*   **Incident Commander (IC):** The senior engineer on duty is responsible for coordinating the entire incident response. All communication flows through the IC.
*   **Technical Lead (TL):** The engineer with the deepest knowledge of the affected system. The TL is responsible for technical investigation and remediation.
*   **Communications Lead (CL):** Responsible for managing all internal and external communications.

## 2. Incident Response Phases

The response to any security incident will follow the PICERL framework: Preparation, Identification, Containment, Eradication, Recovery, and Lessons Learned.

### Phase 1: Preparation

*   **Control:** This document, along with the other compliance artifacts (`system-architecture.md`, `data-flow.md`, `threat-model.md`), constitutes the core of our preparation.
*   **Control:** All engineers have read-only access to Google Cloud Logging and Monitoring to facilitate investigation.

### Phase 2: Identification

*   **Vector:** An incident may be identified via:
    *   Alerts from Google Cloud Monitoring (e.g., a spike in function errors).
    *   Anomalies discovered during manual log review in Cloud Logging.
    *   External report (e.g., from a user).
*   **Action:** The first responder immediately escalates to the on-duty engineer, who becomes the Incident Commander.
*   **Action:** The IC declares an incident and establishes a secure communication channel (e.g., a dedicated Slack channel or Google Meet).

### Phase 3: Containment

*   **Objective:** Limit the scope and impact of the incident.
*   **Application-Level Breach (e.g., cross-tenant data access):**
    1.  **Immediate Action:** If an API endpoint is being exploited, the IC will make the decision to disable the offending Cloud Function via the Google Cloud Console. This is the fastest way to stop the immediate threat.
    2.  **User-Level Containment:** If a single user account is identified as the source of malicious activity, that account will be disabled in the Firebase Authentication console.
*   **Infrastructure-Level Breach:** We rely on Google Cloud's incident response team. Our responsibility is to liaise with them and follow their guidance.

### Phase 4: Eradication

*   **Objective:** Remove the root cause of the incident.
*   **Action:** The Technical Lead, based on the investigation, will develop a code fix for the vulnerability.
*   **Action:** The fix will go through an expedited but mandatory code review and testing process. The existing adversarial tests will be updated to explicitly check for the exploited vulnerability.

### Phase 5: Recovery

*   **Objective:** Restore the system to a secure, operational state.
*   **Action:** The validated code fix is deployed to production via the standard `firebase deploy` command.
*   **Action:** If Cloud Functions were disabled, they are re-enabled.
*   **Action:** The IC and TL will monitor logs and system metrics closely to ensure the fix is effective and has not introduced any new issues.

### Phase 6: Lessons Learned (Post-Mortem)

*   **Objective:** Prevent the incident from recurring.
*   **Action:** Within 7 days of the incident being resolved, the IC will lead a blameless post-mortem.
*   **Output:** The post-mortem will produce a report detailing:
    *   The timeline of the incident.
    *   The root cause.
    *   The impact.
    *   What went well in the response.
    *   What could be improved.
    *   Action items for preventing recurrence.
