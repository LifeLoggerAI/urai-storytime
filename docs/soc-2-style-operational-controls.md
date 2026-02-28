# SOC-2 Style Operational Controls

## Overview

While URAI-Storytime is not formally SOC-2 certified at launch, we operate under a set of controls inspired by the SOC 2 framework to ensure enterprise-grade security, availability, and confidentiality. This document outlines our core operational commitments.

### 1. Security Controls

*   **Authentication:** Multi-Factor Authentication (MFA) is mandatory for all internal accounts with access to production or staging environments (e.g., Firebase Console, Google Cloud).
*   **Access Control:** Production and staging environments have entirely separate access controls. Access is granted based on the principle of least privilege.
*   **Credential Management:** All secrets, API keys, and service account credentials are required to be stored in a centralized, encrypted secret manager (e.g., Google Secret Manager). There will be no hardcoded credentials in the codebase.
*   **Key Rotation:** Service account keys and other critical secrets are scheduled for mandatory rotation on a quarterly basis.

### 2. Availability Controls

*   **Monitoring:** We will implement proactive monitoring for core services, including Firebase uptime, Cloud Function execution, and Stripe webhook health.
*   **Alerting:** An automated alerting system will be configured to notify the core team immediately of critical errors, security events, or service disruptions.
*   **Resilience:** Cloud Functions are designed to be stateless and auto-scaling to handle fluctuations in load. They will be configured to auto-restart on failure.

### 3. Confidentiality Controls

*   **Data Minimization:** We strictly adhere to the data minimization principles outlined in our ethical policies. No PII is stored beyond the absolute minimum required for the service to function.
*   **No Tracking:** The platform contains no third-party tracking pixels or behavioral analytics services that would compromise user privacy.
*   **Encryption:** All data is encrypted both at rest (in Firestore and Cloud Storage) and in transit (via TLS).

### 4. Change Management Controls

*   **Version Control:** All changes to the production codebase must go through a formal pull request (PR) process in a version control system (e.g., Git).
*   **Peer Review:** No code is merged into the main branch without a mandatory review from at least one other qualified team member.
*   **Prohibit Direct Edits:** Direct edits or pushes to the production branch are strictly prohibited. All changes must follow the PR process.
*   **Release & Rollback:** Every production deployment is logged. We maintain a clear and tested rollback strategy to quickly revert to a previous stable version in case of a critical issue.
