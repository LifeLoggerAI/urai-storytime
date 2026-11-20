/**
 * Review-only, fail-closed signed Family Stories Privacy receipt verifier.
 * This is a proposed wire contract, NOT a canonical issuer registration or
 * production trust approval. A pinned Ed25519 public key must be independently
 * approved and provisioned by canonical Privacy, never by a client or receipt.
 * No local signing key or token minting belongs in deployed Storytime.
 */
import { createPublicKey, verify } from "node:crypto";

export type FamilyPrivacySignedFields = {
  schemaVersion: string; id: string; userId: string;
  sourceSessionId: string; recipientUid: string; sourceVersionId: string;
  shareEpoch: number; purpose: string; policyVersion: string;
  decision: string; issuedBy: string; approvedProjectionSha256: string;
  expiresAtMs: number;
};

const orderedFields = [
  "schemaVersion", "id", "userId", "sourceSessionId", "recipientUid",
  "sourceVersionId", "shareEpoch", "purpose", "policyVersion", "decision",
  "issuedBy", "approvedProjectionSha256", "expiresAtMs"
] as const;

export function canonicalFamilyPrivacyReceiptBytes(fields: FamilyPrivacySignedFields): Buffer {
  const values = orderedFields.map((field) => fields[field]);
  return Buffer.from(JSON.stringify(["urai-family-privacy-receipt-v1", ...values]), "utf8");
}

export function verifyFamilyPrivacyReceiptSignature(
  fields: FamilyPrivacySignedFields, signature: unknown, signerKeyId: unknown,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  try {
    const keyId = env.STORYTIME_FAMILY_PRIVACY_ED25519_KEY_ID;
    const publicKeyBase64 = env.STORYTIME_FAMILY_PRIVACY_ED25519_PUBLIC_KEY_SPKI_B64;
    if (!keyId || !/^[A-Za-z0-9._-]{8,100}$/.test(keyId)
      || typeof signerKeyId !== "string" || signerKeyId !== keyId
      || !publicKeyBase64 || typeof signature !== "string"
      || !/^[A-Za-z0-9_-]{86}$/.test(signature)
      || !/^[a-f0-9]{64}$/.test(fields.approvedProjectionSha256)
      || !Number.isSafeInteger(fields.shareEpoch) || fields.shareEpoch < 0
      || !Number.isSafeInteger(fields.expiresAtMs) || fields.expiresAtMs < 0
      || fields.schemaVersion !== "storytime-consent-decision-receipt-v1"
      || fields.purpose !== "storytime.family_share"
      || fields.policyVersion !== "family-story-share-v1"
      || fields.decision !== "authorized" || fields.issuedBy !== "urai-privacy") return false;
    for (const name of [
      "id", "userId", "sourceSessionId", "recipientUid", "sourceVersionId"
    ] as const) {
      if (typeof fields[name] !== "string" || fields[name].length < 1
        || fields[name].length > 220 || !/^[A-Za-z0-9._-]+$/.test(fields[name])) return false;
    }
    // Strict base64 round trip rejects padding, noncanonical forms or extra bytes.
    const spki = Buffer.from(publicKeyBase64, "base64");
    if (spki.toString("base64") !== publicKeyBase64) return false;
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    if (key.asymmetricKeyType !== "ed25519") return false;
    const signatureBytes = Buffer.from(signature, "base64url");
    if (signatureBytes.length !== 64 || signatureBytes.toString("base64url") !== signature) return false;
    return verify(null, canonicalFamilyPrivacyReceiptBytes(fields), key, signatureBytes);
  } catch {
    return false;
  }
}
