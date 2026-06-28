export type StorytimeRuntimeConfig = {
  cloudModeEnabled: boolean;
  publicSharingEnabled: boolean;
  firebaseClientConfigured: boolean;
  firebaseAdminConfigured: boolean;
  providerConfigured: boolean;
  missingFirebaseClientEnv: string[];
  missingFirebaseAdminEnv: string[];
  providerName: "openai" | "disabled" | "unknown";
};

export const FIREBASE_CLIENT_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID"
] as const;

export const FIREBASE_ADMIN_ENV_KEYS = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"] as const;

export function truthyEnv(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function missingKeys(env: Record<string, string | undefined>, keys: readonly string[]) {
  return keys.filter((key) => !env[key]?.trim());
}

export function getStorytimeRuntimeConfig(env: Record<string, string | undefined> = process.env): StorytimeRuntimeConfig {
  const missingFirebaseClientEnv = missingKeys(env, FIREBASE_CLIENT_ENV_KEYS);
  const missingFirebaseAdminEnv = missingKeys(env, FIREBASE_ADMIN_ENV_KEYS);
  const providerName = env.STORYTIME_GENERATION_PROVIDER === "openai" ? "openai" : env.STORYTIME_GENERATION_PROVIDER ? "unknown" : "disabled";
  const providerConfigured = truthyEnv(env.NEXT_PUBLIC_STORYTIME_PROVIDER_READY) || (providerName === "openai" && Boolean(env.OPENAI_API_KEY?.trim()));

  return {
    cloudModeEnabled: truthyEnv(env.NEXT_PUBLIC_STORYTIME_CLOUD_MODE) || truthyEnv(env.STORYTIME_CLOUD_MODE),
    publicSharingEnabled: truthyEnv(env.NEXT_PUBLIC_STORYTIME_PUBLIC_SHARING) || truthyEnv(env.STORYTIME_PUBLIC_SHARING),
    firebaseClientConfigured: missingFirebaseClientEnv.length === 0,
    firebaseAdminConfigured: missingFirebaseAdminEnv.length === 0,
    providerConfigured,
    missingFirebaseClientEnv,
    missingFirebaseAdminEnv,
    providerName
  };
}

export function isStorytimeCloudCallableReady(env: Record<string, string | undefined> = process.env): boolean {
  const config = getStorytimeRuntimeConfig(env);
  return config.cloudModeEnabled && config.firebaseClientConfigured && config.providerConfigured;
}

export function isPublicSharingReady(env: Record<string, string | undefined> = process.env): boolean {
  const config = getStorytimeRuntimeConfig(env);
  return config.publicSharingEnabled && config.firebaseClientConfigured;
}
