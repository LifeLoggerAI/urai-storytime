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
  if (!args.isCurrentAccount()) throw new Error("Storytime account changed before download.");
  const response = await (args.fetcher ?? fetch)(endpoint.toString(), {
    method: "GET", headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer"
  });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("application/json")) {
    throw new Error("The export is unavailable. Confirm current account and export authority or create a new request.");
  }
  const blob = await response.blob();
  const body = JSON.stringify(JSON.parse(await blob.text()));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  if (hash !== grant.packageSha256) throw new Error("The export package integrity check failed.");
  if (!args.isCurrentAccount()) throw new Error("Storytime account changed during download.");
  return blob;
}
