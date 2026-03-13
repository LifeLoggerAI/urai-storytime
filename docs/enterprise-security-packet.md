
# Enterprise Security Packet

This document provides a comprehensive overview of the security program for the Storytime application. It is intended for customers, partners, and auditors who require assurance about our security and compliance posture.

---

## 1. Our Commitment to Security

We are committed to protecting the data of our users. Security is a first-class citizen in our engineering process, from initial design through to deployment and ongoing operations. Our application is built on the secure, scalable, and reliable infrastructure of Google Cloud and Firebase.

## 2. Security Architecture

The Storytime application is a modern, serverless web application designed with a multi-layered security model. The core principle is **Zero Trust**; no component of the system is trusted by default.

*   **Frontend:** A static Next.js web application served via the Firebase Hosting CDN, ensuring high performance and resilience.
*   **Backend:** A set of serverless Node.js Cloud Functions that encapsulate all business logic.
*   **Database:** A Cloud Firestore database with multi-tenant data isolation enforced by server-side security rules.
*   **Storage:** Google Cloud Storage for assets, with a `deny-all` access policy. Files are accessible only via short-lived, secure signed URLs.

For a detailed diagram and explanation, please see the [**System Architecture Document**](./system-architecture.md).

## 3. Key Security Controls

We have implemented a wide range of technical controls to protect our application and your data.

| Control Area | Implementation |
| :--- | :--- |
| **Data Isolation** | All data access is strictly controlled by a multi-layered system that verifies user ownership at both the API and database levels. It is impossible for one user to access another user's data. |
| **Data Encryption** | All data is encrypted at rest (in Firestore and Cloud Storage) and in transit (via TLS) by default. |
| **Authentication** | User authentication is handled by the secure, industry-standard Firebase Authentication service. |
| **Immutability** | Core data records are configured to be immutable, preventing unauthorized or accidental deletion or modification. |
| **Secure Access** | Access to sensitive files (like audio stories) is granted exclusively through short-lived, single-use Signed URLs generated for an authenticated and authorized user. Direct storage access is blocked. |
| **Infrastructure** | The entire system runs on Google's secure, managed, and auto-scaling serverless infrastructure, which provides protection against common infrastructure-level attacks. |

For a complete analysis of threats and their mitigations, please see our [**Threat Model (STRIDE)**](./threat-model.md).

## 4. Compliance & Governance

Our security program is aligned with leading industry standards to meet your compliance requirements.

*   **SOC 2:** Our controls are mapped to the SOC 2 Trust Service Criteria for Security, Availability, and Confidentiality. See the [**SOC 2 Control Mapping**](./soc2-control-mapping.md).
*   **ISO 27001:** Our controls are mapped to the relevant articles of ISO/IEC 27001. See the [**ISO 27001 SoA Mapping**](./iso-27001-soa-mapping.md).

## 5. Incident Management

We have a documented process for responding to security incidents to ensure a swift and effective reaction.

*   [**Incident Response Plan**](./incident-response-plan.md)
*   [**Disaster Recovery Runbook**](./disaster-recovery-runbook.md)
*   [**Backup Restore Validation Procedure**](./backup-restore-validation-procedure.md)

## 6. Independent Verification

Our security posture is validated through both internal and external testing.

*   **Adversarial Testing:** Our internal test suite includes a suite of adversarial tests that explicitly attempt to bypass our security controls.
*   **Penetration Testing:** We have a process for engaging with third-party security vendors to perform regular penetration tests. See our [**Red-Team Simulation Checklist**](./red-team-simulation-checklist.md) and [**External Pentest Readiness Checklist**](./external-pentest-readiness-checklist.md).
