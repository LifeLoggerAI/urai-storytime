
# ISO 27001 Statement of Applicability (SoA) Mapping

This document maps the implemented technical controls of the Storytime application to the relevant controls from Annex A of the ISO/IEC 27001:2013 standard. It serves as a Statement of Applicability for the technical implementation.

---

## A.9 Access Control

*   **A.9.1.1 (Access Control Policy):**
    *   **Control Statement:** An access control policy shall be established, documented, and reviewed.
    *   **Implementation:** The access control policy is defined and enforced by a combination of Firebase Authentication, server-side API logic, and database security rules (`firestore.rules`, `storage.rules`). The policy is that a user can only access data for which they are the designated owner.

*   **A.9.2.3 (User Access Management):**
    *   **Control Statement:** A formal user access provisioning process shall be implemented.
    *   **Implementation:** User provisioning is self-service via Firebase Authentication. Access rights are granted programmatically based on the `ownerUid` field, not manual assignment, which eliminates the risk of human error in provisioning.

*   **A.9.4.1 (Limitation of Access to Information):**
    *   **Control Statement:** Access to information and application system functions by users and support personnel shall be restricted in accordance with the established access control policy.
    *   **Implementation:** The multi-layered security model (API checks + database rules) strictly enforces the "owner-only" access policy. There are no backdoors or alternative access paths. Cloud Storage rules are set to `deny all`, with access provided only through single-use signed URLs.

## A.10 Cryptography

*   **A.10.1.1 (Policy on the Use of Cryptographic Controls):**
    *   **Control Statement:** A policy on the use of cryptographic controls for protection of information shall be defined and implemented.
    *   **Implementation:** The policy is to encrypt all data.
        *   **Data in Transit:** All traffic is forced over HTTPS/TLS by default by Firebase Hosting and Cloud Functions.
        *   **Data at Rest:** All data in Cloud Firestore and Cloud Storage is encrypted at rest by Google Cloud by default.

## A.12 Operations Security

*   **A.12.1.2 (Protection against Malware):**
    *   **Control Statement:** Controls to provide protection against malware shall be implemented and used.
    *   **Implementation:** The entire application stack is serverless and managed by Google, which is responsible for protecting the underlying infrastructure from malware.

*   **A.12.4.1 (Event Logging):**
    *   **Control Statement:** Event logs recording user activities, exceptions, faults and information security events shall be produced, kept and regularly reviewed.
    *   **Implementation:** Google Cloud Logging automatically captures all API requests to Cloud Functions, all interactions with Firestore, and all administrative actions. These logs are retained and available for review.

## A.14 System Acquisition, Development and Maintenance

*   **A.14.2.1 (Secure Development Policy):**
    *   **Control Statement:** Rules for the development of software and systems shall be established and applied.
    *   **Implementation:** The secure development policy is codified in the test suite. The adversarial tests (`test/adversarial.test.js`) explicitly define the security boundaries that must not be violated. All tests must pass before deployment.

*   **A.14.2.5 (Secure System Engineering Principles):**
    *   **Control Statement:** Principles for engineering secure systems shall be established, documented, maintained and applied.
    *   **Implementation:** The system is engineered on the principle of defense-in-depth. A threat at one layer (e.g., an attempted bypass of the API) is mitigated by controls at another layer (e.g., the database security rules). The principle of least privilege is also enforced throughout.

## A.18 Compliance

*   **A.18.1.3 (Protection of Records):**
    *   **Control Statement:** Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release.
    *   **Implementation:** The core data records (`families`, `stories`) are made immutable for this version via Firestore rules (`allow update, delete: if false;`). This protects them from unauthorized or accidental modification and destruction.
