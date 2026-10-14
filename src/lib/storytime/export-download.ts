/** Browser limit prevents an untrusted HTTP response exhausting private client memory.
 * Larger legitimate exports remain a governed support/server-delivery operation. */
export const STORYTIME_EXPORT_BROWSER_MAX_BYTES = 128 * 1024 * 1024;

export type StorytimeExportDownload = {
  privacyRequestId: string;
  url: string;
  requiresAuthorization: true;
  expiresAt: string;
  packageSha256: string;
};

export async function fetchAuthorizedStorytimeExport(args: {
  authorization: StorytimeExportDownload;
  projectId: string;
  getIdToken: () => Promise<string>;
  isCurrentAccount: () => boolean;
  fetcher?: typeof fetch;
}): Promise<Blob> {
  const grant = args.authorization;
  const endpoint = new URL(grant.url);
  if (grant.requiresAuthorization !== true || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(args.projectId)
    || endpoint.protocol !== "https:" || endpoint.hostname !== `us-central1-${args.projectId}.cloudfunctions.net`
    || endpoint.port !== "" || endpoint.pathname !== "/downloadStorytimeExportPackage"
    || endpoint.username || endpoint.password || endpoint.hash
    || endpoint.searchParams.get("privacyRequestId") !== grant.privacyRequestId
    || !/^[0-9a-f]{64}$/.test(endpoint.searchParams.get("authorityHash") ?? "")
    || !/^[0-9a-f]{64}$/.test(grant.packageSha256)
    || !Number.isFinite(Date.parse(grant.expiresAt)) || Date.parse(grant.expiresAt) <= Date.now()
    || Number(endpoint.searchParams.get("expiresAt")) !== Date.parse(grant.expiresAt)) {
    throw new Error("The export download is not authorized for the configured Storytime Firebase project.");
  }
  if (!args.isCurrentAccount()) throw new Error("Current Storytime account is required.");
  const token = await args.getIdToken();
  if (!args.isCurrentAccount() || Date.now() >= Date.parse(grant.expiresAt)) throw new Error("Storytime account changed or export authority expired before download.");
  const response = await (args.fetcher ?? fetch)(endpoint.toString(), {
    method: "GET", headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(Math.max(1, Math.min(5 * 60_000, Date.parse(grant.expiresAt) - Date.now())))
  });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("application/json") || !response.body) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error("The export is unavailable. Confirm current account and export authority or create a new request.");
  }
  const declared = response.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared))
    || Number(declared) > STORYTIME_EXPORT_BROWSER_MAX_BYTES)) {
    await response.body.cancel().catch(() => undefined);
    throw new Error("The private export exceeds the safe browser size limit. Request a governed larger export.");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      if (!args.isCurrentAccount() || Date.now() >= Date.parse(grant.expiresAt)) {
        throw new Error("Storytime account changed or export authority expired during download.");
      }
      const next = await reader.read();
      if (!args.isCurrentAccount() || Date.now() >= Date.parse(grant.expiresAt)) {
        throw new Error("Storytime account changed or export authority expired during download.");
      }
      if (next.done) break;
      size += next.value.byteLength;
      if (size > STORYTIME_EXPORT_BROWSER_MAX_BYTES || (declared !== null && size > Number(declared))) {
        throw new Error("The private export exceeds the safe browser size limit. Request a governed larger export.");
      }
      chunks.push(next.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new Error("The private export contains no bytes.");
  if (declared !== null && size !== Number(declared)) {
    throw new Error("The private export is incomplete or inconsistent with the declared length.");
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const body = JSON.stringify(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  if (hash !== grant.packageSha256) throw new Error("The export package integrity check failed.");
  if (!args.isCurrentAccount() || Date.now() >= Date.parse(grant.expiresAt)) {
    throw new Error("Storytime account changed or export authority expired during download.");
  }
  return new Blob([bytes], { type: "application/json" });
}
