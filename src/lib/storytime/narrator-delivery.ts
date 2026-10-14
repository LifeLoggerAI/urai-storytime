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
  // The server caps private audio at 64 MiB and expires delivery authority.
  // Bound browser memory and recheck the active session for each received chunk.
  const MAX_NARRATOR_AUDIO_BYTES = 64 * 1024 * 1024;
  const deadline = Math.min(d.expiresAt, Date.now() + 50_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1, deadline - Date.now()));
  try {
    const response = await (args.fetcher ?? fetch)(endpoint, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ voiceoverJobId: args.voiceoverJobId, delivery: d }),
      cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer",
      signal: controller.signal
    });
    if (!args.isCurrentAccount()) throw new Error("Storytime account changed during delivery.");
    if (!response.ok || !response.body || !["audio/mpeg", "audio/ogg"].includes(response.headers.get("content-type")?.split(";")[0].trim() ?? "")) {
      throw new Error("Narrator audio is unavailable under current consent and account authority.");
    }
    const declared = response.headers.get("content-length");
    if (declared !== null && (!/^(0|[1-9][0-9]*)$/.test(declared)
      || !Number.isSafeInteger(Number(declared)) || Number(declared) > MAX_NARRATOR_AUDIO_BYTES)) {
      void response.body.cancel().catch(() => {});
      throw new Error("Narrator audio exceeds the safe browser download limit.");
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        if (!args.isCurrentAccount() || controller.signal.aborted || Date.now() >= deadline) {
          throw new Error("Storytime account or narrator delivery authority changed during download.");
        }
        const next = await reader.read();
        if (!args.isCurrentAccount() || controller.signal.aborted || Date.now() >= deadline) {
          throw new Error("Storytime account or narrator delivery authority changed during download.");
        }
        if (next.done) break;
        bytes += next.value.byteLength;
        if (bytes > MAX_NARRATOR_AUDIO_BYTES || (declared !== null && bytes > Number(declared))) {
          throw new Error("Narrator audio exceeds the safe browser download limit.");
        }
        chunks.push(next.value);
      }
    } finally {
      void reader.cancel().catch(() => {});
      try { reader.releaseLock(); } catch { /* an aborted pending reader owns its lock */ }
    }
    if (!bytes || (declared !== null && bytes !== Number(declared))) {
      throw new Error("Narrator audio is incomplete or inconsistent with the declared length.");
    }
    if (!args.isCurrentAccount() || controller.signal.aborted || Date.now() >= deadline) {
      throw new Error("Storytime account or narrator delivery authority changed during download.");
    }
    return new Blob(chunks as BlobPart[], { type: response.headers.get("content-type")?.split(";")[0].trim() || "audio/mpeg" });
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
