import { getAuth } from "firebase-admin/auth";
import { HttpsError } from "firebase-functions/v2/https";

type StorytimeActorRequest = {
  auth?: { uid: string; token?: Record<string, unknown> } | null;
  rawRequest?: { get(header: string): string | undefined };
};

async function currentStorytimeActor(request: StorytimeActorRequest, administrative: boolean) {
  const uid = request.auth?.uid, claims = request.auth?.token;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  if (administrative ? claims?.admin !== true && claims?.role !== "admin" : claims?.email_verified !== true) {
    throw new HttpsError(administrative ? "permission-denied" : "failed-precondition",
      administrative ? "Admin authority is required for destructive Storytime deletion."
        : "Verify the account email before using Storytime privacy operations.");
  }
  const bearer = request.rawRequest?.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!bearer) throw new HttpsError("unauthenticated", "Current Storytime privacy authentication is required.");
  const auth = getAuth();
  let decoded, account;
  try {
    decoded = await auth.verifyIdToken(bearer, true);
    if (decoded.uid !== uid) throw new Error();
    account = await auth.getUser(uid);
    // Account reads are asynchronous too. A credential withdrawn during that
    // read must not survive until a private mutation or a returned capability.
    decoded = await auth.verifyIdToken(bearer, true);
    if (decoded.uid !== uid || account.uid !== uid) throw new Error();
  } catch { throw new HttpsError("unauthenticated", "Current Storytime privacy authentication is required."); }
  if (account.disabled) throw new HttpsError("permission-denied", "Current Storytime privacy account is unavailable.");
  if (administrative) {
    if (account.customClaims?.admin !== true && account.customClaims?.role !== "admin") {
      throw new HttpsError("permission-denied", "Current Storytime deletion admin authority is required.");
    }
  } else if (decoded.email_verified !== true || account.emailVerified !== true) {
    throw new HttpsError("failed-precondition", "Current verified Storytime owner authority is required.");
  }
  return uid;
}

export const requireCurrentStorytimeOwner = (request: StorytimeActorRequest) => currentStorytimeActor(request, false);
export const requireCurrentStorytimeAdmin = (request: StorytimeActorRequest) => currentStorytimeActor(request, true);
