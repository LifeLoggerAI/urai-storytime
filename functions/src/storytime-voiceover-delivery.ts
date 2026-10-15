import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getAuth } from "firebase-admin/auth";
import { FieldPath, getFirestore, type Transaction } from "firebase-admin/firestore";
import { HttpsError, onRequest } from "firebase-functions/v2/https";
import { z } from "zod";
import { StorytimeNarratorDeliverySchema } from "./storytime-media-delivery-contract.js";
import { storytimeJobsBridgeTokenSecret, storytimeJobsBridgeToken, storytimeJobsBridgeUrl } from "./storytime.js";

const db = getFirestore();
const auth = getAuth();
const inputSchema = z.object({ voiceoverJobId: z.string().min(1).max(300).regex(/^[^/]+$/), delivery: StorytimeNarratorDeliverySchema }).strict();

async function readVoiceoverAuthority(transaction: Transaction, userId: string, input: z.infer<typeof inputSchema>) {
  const jobRef = db.collection("voiceoverJobs").doc(input.voiceoverJobId);
  const jobSnapshot = await transaction.get(jobRef);
  const job = jobSnapshot.data() ?? {};
  const delivery = input.delivery;
  if (!jobSnapshot.exists || job.userId !== userId) throw new HttpsError("permission-denied", "Voiceover job is unavailable.");
  if (job.externalSystem !== "urai-jobs" || job.externalJobId !== delivery.jobId
    || job.sessionId !== delivery.sessionId || job.narratorScriptId !== delivery.narratorScriptId
    || !["queued", "running", "completed", "done"].includes(job.status)
    || typeof job.consentReceiptId !== "string" || !job.consentReceiptId || job.consentReceiptId.includes("/")) {
    throw new HttpsError("failed-precondition", "Voiceover worker binding is unavailable.");
  }
  const [sessionSnapshot, scriptSnapshot, consentSnapshot] = await Promise.all([
    transaction.get(db.collection("storySessions").doc(delivery.sessionId)),
    transaction.get(db.collection("narratorScripts").doc(delivery.narratorScriptId)),
    transaction.get(db.collection("consentDecisionReceipts").doc(job.consentReceiptId))
  ]);
  const session = sessionSnapshot.data() ?? {}, script = scriptSnapshot.data() ?? {}, consent = consentSnapshot.data() ?? {};
  if (!sessionSnapshot.exists || session.userId !== userId || session.consentSnapshot?.voiceover !== true
    || session.safetyStatus !== "approved" || session.deleted === true || session.retired === true || session.revoked === true
    || !scriptSnapshot.exists || script.userId !== userId || script.sessionId !== delivery.sessionId
    || script.deleted === true || script.retired === true || script.revoked === true || typeof script.text !== "string" || !script.text.trim()
    || !consentSnapshot.exists || consent.userId !== userId || consent.purpose !== "storytime.voiceover"
    || consent.policyVersion !== "storytime-voiceover-consent-v1" || consent.decision !== "authorized"
    || consent.sourceSessionId !== delivery.sessionId || consent.narratorScriptId !== delivery.narratorScriptId) {
    throw new HttpsError("failed-precondition", "Current Storytime voiceover consent or source authority is unavailable.");
  }
  let cursor;
  while (true) {
    let query = db.collection("privacyRequests").where("userId", "==", userId).orderBy(FieldPath.documentId()).limit(400);
    if (cursor) query = query.startAfter(cursor);
    const requests = await transaction.get(query);
    if (requests.docs.some((row) => {
      const request = row.data();
      return request.type === "deletion" && !["cancelled", "rejected"].includes(request.status)
        && (request.scope === "account" || (request.scope === "story_session" && request.sessionId === delivery.sessionId));
    })) throw new HttpsError("failed-precondition", "Relevant Storytime deletion authority blocks voiceover delivery.");
    if (requests.size < 400) break;
    cursor = requests.docs.at(-1);
    if (!cursor) throw new HttpsError("failed-precondition", "Storytime deletion authority could not be fully read.");
  }
  const identityHash = createHash("sha256").update(JSON.stringify({ userId, jobId: delivery.jobId,
    voiceoverJobId: input.voiceoverJobId, sessionId: delivery.sessionId, narratorScriptId: delivery.narratorScriptId,
    currentVersionId: session.currentVersionId ?? null, sessionConsent: session.consentSnapshot,
    scriptText: script.text, scriptUpdatedAt: script.updatedAt ?? null, receipt: consent })).digest("hex");
  return { identityHash };
}

export const deliverStorytimeVoiceover = onRequest({ cors: true, timeoutSeconds: 120, memory: "256MiB", secrets: [storytimeJobsBridgeTokenSecret] }, async (request, response) => {
  const started = Date.now(), startedMonotonic = performance.now();
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  response.set({ "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" });
  if (request.method !== "POST") { response.set("Allow", "POST").status(405).json({ error: "method_not_allowed" }); return; }
  try {
    const bearer = request.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!bearer) throw new HttpsError("unauthenticated", "Authentication is required.");
    let verified;
    try { verified = await auth.verifyIdToken(bearer, true); }
    catch { throw new HttpsError("unauthenticated", "Current authentication is required."); }
    if (verified.email_verified !== true) throw new HttpsError("failed-precondition", "A verified Storytime account is required.");
    const userId = verified.uid;
    const input = inputSchema.parse(request.body);
    const delivery = input.delivery;
    const remaining = Math.min(50_000, delivery.expiresAt - started);
    if (remaining <= 0) throw new HttpsError("failed-precondition", "Narrator delivery authority expired.");
    const monotonicDeadline = startedMonotonic + remaining;
    timeout = setTimeout(() => controller.abort(), Math.max(0, monotonicDeadline - performance.now()));
    response.once("close", () => { if (!response.writableFinished) controller.abort(); });
    const initial = await db.runTransaction((transaction) => readVoiceoverAuthority(transaction, userId, input));
    const bridgeToken = storytimeJobsBridgeToken();
    if (!bridgeToken) throw new HttpsError("failed-precondition", "Storytime narrator bridge authority is unavailable.");
    if (delivery.expiresAt <= Date.now() || performance.now() >= monotonicDeadline) throw new HttpsError("failed-precondition", "Narrator authority expired before the bridge request.");
    const upstream = await fetch(storytimeJobsBridgeUrl(), {
      method: "POST", headers: { Authorization: `Bearer ${bridgeToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deliver", kind: "audio", userId, sessionId: delivery.sessionId,
        narratorScriptId: delivery.narratorScriptId, jobId: delivery.jobId,
        authorityHash: delivery.authorityHash, expiresAt: delivery.expiresAt, generation: delivery.generation }),
      redirect: "error", cache: "no-store", signal: controller.signal
    });
    const contentType = upstream.headers.get("content-type")?.split(";")[0].trim();
    if (!upstream.ok || !upstream.body || !["audio/mpeg", "audio/ogg"].includes(contentType ?? "")) {
      await upstream.body?.cancel();
      throw new HttpsError("failed-precondition", "Current narrator bridge delivery is unavailable.");
    }
    const auditRef = db.collection("privacyOperationReceipts").doc();
    await db.runTransaction(async (transaction) => {
      const current = await readVoiceoverAuthority(transaction, userId, input);
      if (current.identityHash !== initial.identityHash || delivery.expiresAt <= Date.now()
        || performance.now() >= monotonicDeadline || controller.signal.aborted) {
        throw new HttpsError("failed-precondition", "Storytime narrator authority changed before delivery.");
      }
      transaction.create(auditRef, { schemaVersion: "storytime-private-media-delivery-receipt-v1",
        sourceRepo: "LifeLoggerAI/urai-storytime", userId, type: "voiceover_delivery_authorized",
        voiceoverJobId: input.voiceoverJobId, jobId: delivery.jobId, sourceIdentityHash: current.identityHash,
        deliveryAuthorityHash: delivery.authorityHash, expiresAt: delivery.expiresAt, createdAt: new Date().toISOString() });
    });
    response.set({ "Content-Type": contentType!, "Content-Disposition": "inline" });
    const guarded = Readable.from((async function* () {
      const reader = upstream.body!.getReader();
      let emittedBytes = 0;
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          for (let offset = 0; offset < result.value.length; offset += 64 * 1024) {
            const chunk = result.value.subarray(offset, offset + 64 * 1024);
            const active = await auth.verifyIdToken(bearer, true);
            if (active.uid !== userId || active.email_verified !== true) throw new HttpsError("unauthenticated", "Current narrator account authority is unavailable.");
            const current = await db.runTransaction((transaction) => readVoiceoverAuthority(transaction, userId, input));
            if (current.identityHash !== initial.identityHash || delivery.expiresAt <= Date.now()
              || performance.now() >= monotonicDeadline || controller.signal.aborted
              || storytimeJobsBridgeToken() !== bridgeToken || emittedBytes + chunk.length > 64 * 1024 * 1024) {
              throw new HttpsError("failed-precondition", "Storytime narrator authority changed during delivery.");
            }
            emittedBytes += chunk.length;
            yield chunk;
          }
        }
      } finally { await reader.cancel().catch(() => {}); }
    })());
    await pipeline(guarded, response);
  } catch (error) {
    controller.abort();
    if (response.headersSent || response.destroyed) return;
    const status = error instanceof HttpsError
      ? ({ unauthenticated: 401, "permission-denied": 403, "not-found": 404, "failed-precondition": 409 } as Record<string, number>)[error.code] ?? 500
      : error instanceof z.ZodError ? 400 : 500;
    response.status(status).json({ error: "storytime_narrator_delivery_unavailable" });
  } finally { if (timeout) clearTimeout(timeout); }
});
