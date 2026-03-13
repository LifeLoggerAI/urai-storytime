
# Conceptual Terraform Blueprint for a Zero-Trust GCP Architecture

This document contains conceptual code samples illustrating how the security principles of the Storytime application could be applied to a more complex, Terraform-managed GCP environment. **This does not represent the as-built architecture.**

---

## 1. Zero-Trust Terraform `main.tf`

This sample illustrates key zero-trust principles:

*   **VPC Service Controls:** Creates a service perimeter to prevent data exfiltration.
*   **Private Networking:** Forces services like Cloud Run and Cloud SQL to use internal IPs.
*   **Principle of Least Privilege:** Defines a granular, per-service IAM role.
*   **Secrets Management:** Injects secrets from Secret Manager rather than plaintext.

```terraform
# --- 1. Network Security (VPC Service Controls) ---
# Assumes an access level and policy have been created
resource "google_access_context_manager_service_perimeter" "app_perimeter" {
  parent = "accessPolicies/your_access_policy"
  name   = "accessPolicies/your_access_policy/servicePerimeters/app_perimeter"
  title  = "Application Perimeter"
  status {
    restricted_services = [
      "storage.googleapis.com",
      "sqladmin.googleapis.com",
      "run.googleapis.com"
    ]
  }
}

# --- 2. Application Hosting (Private Cloud Run) ---
resource "google_cloud_run_v2_service" "private_api" {
  name     = "private-api-service"
  location = "us-central1"

  template {
    containers {
      image = "us-central1-docker.pkg.dev/your-project/repo/api-server:latest"
      env {
        name  = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = "db-password-secret"
            version = "latest"
          }
        }
      }
    }
    # Ingress is internal only, traffic must come from inside the VPC
    ingress = "INGRESS_TRAFFIC_INTERNAL_ONLY"
  }
}

# --- 3. Database Security (Private IP Cloud SQL) ---
resource "google_sql_database_instance" "main" {
  name             = "private-sql-instance"
  database_version = "POSTGRES_14"
  region           = "us-central1"
  settings {
    tier = "db-n1-standard-1"
    ip_configuration {
      ipv4_enabled    = false # No public IP
      private_network = "projects/your-project/global/networks/your-vpc"
    }
  }
}

# --- 4. Identity & Access (Principle of Least Privilege) ---
# Custom IAM Role for the Cloud Run service
resource "google_project_iam_custom_role" "api_service_role" {
  role_id     = "apiServiceRole"
  title       = "API Service Role"
  permissions = [
    "secretmanager.versions.access", # Access to its own secrets
    "cloudsql.instances.connect"     # Access to connect to Cloud SQL
  ]
}

# Service Account for the Cloud Run instance
resource "google_service_account" "api_service_account" {
  account_id   = "api-service-account"
  display_name = "API Service Account"
}

# Bind the custom role to the service account
resource "google_project_iam_member" "api_binding" {
  project = "your-project"
  role    = google_project_iam_custom_role.api_service_role.name
  member  = "serviceAccount:${google_service_account.api_service_account.email}"
}
```

---

## 2. Example RLS Implementation (Cloud SQL)

This is a conceptual SQL policy for a PostgreSQL database that achieves the same tenant isolation as the project's Firestore Rules. It assumes a JWT is passed from the application, and its `sub` (user ID) claim is set as a transaction-local variable.

```sql
-- Enable Row-Level Security on the 'stories' table
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create a policy that checks the user_id against a session variable
-- The application backend is responsible for setting this variable
-- for each transaction based on the authenticated user's JWT.
CREATE POLICY tenant_isolation_policy ON stories
FOR ALL
TO public
USING (
    -- The 'current_setting' must be set by the application for each query
    user_id = current_setting('app.current_user_id')
);

-- Example Application Logic (Backend Pseudocode)
-- const { userId } = await verifyJwt(token);
-- await db.query(`SET LOCAL app.current_user_id = '${userId}'`);
-- const results = await db.query(`SELECT * FROM stories`); // RLS is now active
```

---

## 3. OpenAPI Service Contract

This is a conceptual OpenAPI 3.0 contract for the `generateStory` function.

```yaml
openapi: 3.0.0
info:
  title: Storytime API
  version: 1.0.0
paths:
  /generateStory:
    post:
      summary: Generate a new story
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                familyId:
                  type: string
                childId:
                  type: string
                theme:
                  type: string
              required: [familyId, childId, theme]
      responses:
        '200':
          description: Story generation started
          content:
            application/json:
              schema:
                type: object
                properties:
                  storyId:
                    type: string
        '401':
          description: Unauthorized
        '403':
          description: Forbidden (User does not own the family)
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
