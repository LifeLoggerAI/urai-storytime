import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const forbiddenCredentialVariables = [
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
  "FIREBASE_SERVICE_ACCOUNT_KEY",
  "GOOGLE_CREDENTIALS",
] as const;

export function assertStorytimeFirebaseAdminIdentity(env: NodeJS.ProcessEnv = process.env): "external-account-wif" | "google-metadata" | "quarantine-disabled" {
  const forbidden = forbiddenCredentialVariables.filter((name) => Boolean(env[name]?.trim()));
  if (forbidden.length) {
    throw new Error(`Storytime Firebase Admin rejects long-lived credential variables: ${forbidden.join(", ")}.`);
  }

  const credentialPath = env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credentialPath) {
    if (env.URAI_STORYTIME_FIREBASE_ADMIN_METADATA_READY === "1") {
      return "google-metadata";
    }
    if (env.STORYTIME_CLOUD_MODE !== "true") {
      return "quarantine-disabled";
    }
    throw new Error("Storytime Firebase Admin is NO-GO without a verified external_account WIF file or an independently certified Google metadata identity.");
  }

  let metadata;
  let resolvedPath;
  let raw;
  try {
    metadata = lstatSync(credentialPath);
    resolvedPath = realpathSync(credentialPath);
    raw = readFileSync(credentialPath, "utf8");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Storytime Firebase Admin ADC file cannot be read safely: ${reason}`);
  }

  if (metadata.isSymbolicLink() || !metadata.isFile() || resolvedPath !== credentialPath) {
    throw new Error("Storytime Firebase Admin ADC must be a regular non-symlinked file at its canonical path.");
  }
  if ((metadata.mode & 0o077) !== 0) {
    throw new Error("Storytime Firebase Admin ADC file permissions must not grant group or other access.");
  }

  let credential: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    credential = parsed as Record<string, unknown>;
  } catch {
    throw new Error("Storytime Firebase Admin ADC file must contain a valid JSON object.");
  }

  if (credential.type !== "external_account") {
    throw new Error("Storytime Firebase Admin ADC must use external_account WIF; service_account and authorized_user credentials are forbidden.");
  }
  if ("private_key" in credential || "client_email" in credential) {
    throw new Error("Storytime Firebase Admin ADC must not contain raw service-account key material.");
  }
  for (const field of ["audience", "subject_token_type", "token_url", "credential_source", "service_account_impersonation_url"]) {
    if (!credential[field]) throw new Error(`Storytime external_account ADC is missing ${field}.`);
  }
  if (
    typeof credential.service_account_impersonation_url !== "string"
    || !credential.service_account_impersonation_url.startsWith("https://iamcredentials.googleapis.com/")
  ) {
    throw new Error("Storytime external_account ADC must use Google IAM service-account impersonation.");
  }

  return "external-account-wif";
}

function getFirebaseAdmin() {
  assertStorytimeFirebaseAdminIdentity();
  const existing = getApps()[0];
  const app =
    existing ??
    initializeApp({
      credential: applicationDefault(),
      projectId:
        process.env.FIREBASE_PROJECT_ID ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

export const firebaseAdmin = getFirebaseAdmin();
