export type StorytimeNarratorDelivery = {
  schemaVersion: "urai-authenticated-private-media-v1";
  requiresAuthorization: true;
  action: "deliver";
  kind: "audio";
  authorityHash: string;
  expiresAt: number;
  generation: string;
  jobId: string;
  sessionId: string;
  narratorScriptId: string;
};

// Caller obtains playback.delivery from manageVoiceoverJob. The descriptor is
// nonsecret; only this configured Storytime endpoint receives the Firebase token.
export async function fetchAuthorizedStorytimeNarrator(args: {
  projectId: string;
  voiceoverJobId: string;
  delivery: StorytimeNarratorDelivery;
  getIdToken: () => Promise<string>;
  isCurrentAccount: () => boolean;
  fetcher?: typeof fetch;
}): Promise<Blob> {
  const d = args.delivery;
  if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(args.projectId)
    || !/^[^/]{1,300}$/.test(args.voiceoverJobId)
    || d.schemaVersion !== "urai-authenticated-private-media-v1" || d.requiresAuthorization !== true
    || d.action !== "deliver" || d.kind !== "audio" || !/^[0-9a-f]{64}$/.test(d.authorityHash)
    || !Number.isSafeInteger(d.expiresAt) || d.expiresAt <= Date.now() || !/^[0-9]+$/.test(d.generation)
    || ![d.jobId, d.sessionId, d.narratorScriptId].every((id) => typeof id === "string" && /^[^/]{1,300}$/.test(id))) {
    throw new Error("Current protected narrator delivery authority is required.");
  }
  const endpoint = `https://us-central1-${args.projectId}.cloudfunctions.net/deliverStorytimeVoiceover`;
  if (!args.isCurrentAccount()) throw new Error("Current Storytime account is required.");
  const token = await args.getIdToken();
  if (!args.isCurrentAccount()) throw new Error("Storytime account changed before delivery.");
  const response = await (args.fetcher ?? fetch)(endpoint, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ voiceoverJobId: args.voiceoverJobId, delivery: d }),
    cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer"
  });
  if (!response.ok || !["audio/mpeg", "audio/ogg"].includes(response.headers.get("content-type")?.split(";")[0].trim() ?? "")) {
    throw new Error("Narrator audio is unavailable under current consent and account authority.");
  }
  const blob = await response.blob();
  if (!args.isCurrentAccount()) throw new Error("Storytime account changed during delivery.");
  return blob;
}
