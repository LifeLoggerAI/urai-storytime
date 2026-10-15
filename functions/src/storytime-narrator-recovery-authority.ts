/** Fail-closed authorization for the *staging-only* narrator recovery
 * scheduler. The user setting alone is never enough to enable dispatch.
 * Keep this module free of Firebase dependencies for offline security tests. */
export type NarratorRecoveryEnvironment = Record<string, string | undefined>;

export function canRunStorytimeNarratorRecovery(env: NarratorRecoveryEnvironment): boolean {
  if (env.URAI_STORYTIME_NARRATOR_RECOVERY_ENABLED !== "true") return false;
  if (env.URAI_STORYTIME_NARRATOR_RECOVERY_TEST_ONLY !== "true") return false;
  if (env.STORYTIME_FIREBASE_ISOLATED !== "true") return false;

  const actual = env.GCLOUD_PROJECT || env.GCP_PROJECT || "";
  const approved = env.URAI_STORYTIME_NARRATOR_RECOVERY_PROJECT_ID || "";
  const staging = env.URAI_STORYTIME_STAGING_TARGET || "";
  const production = env.URAI_STORYTIME_PRODUCTION_TARGET || "";
  const configured = env.URAI_STORYTIME_FIREBASE_PROJECT_ID || "";
  if (!actual || !approved || !staging || !production || !configured) return false;
  if (!/^[a-z][a-z0-9-]{4,35}$/.test(approved)) return false;
  if (env.GCLOUD_PROJECT && env.GCP_PROJECT && env.GCLOUD_PROJECT !== env.GCP_PROJECT) return false;
  if (actual !== approved || staging !== approved || configured !== approved) return false;
  if (approved === production || approved === "urai-4dc1d") return false;
  if (approved === env.URAI_CORE_FIREBASE_PROJECT_ID || approved === env.URAI_ANALYTICS_FIREBASE_PROJECT_ID) return false;
  return true;
}
