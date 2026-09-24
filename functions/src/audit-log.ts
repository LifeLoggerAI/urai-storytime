export type StorytimeAuditEvent =
  | "generation_requested"
  | "generation_blocked_auth"
  | "generation_blocked_consent"
  | "generation_blocked_safety"
  | "generation_blocked_output_safety"
  | "generation_blocked_quota"
  | "generation_reused"
  | "provider_unavailable"
  | "provider_failed"
  | "story_persisted"
  | "public_share_created"
  | "public_share_revoked"
  | "voiceover_export_queued"
  | "privacy_request_created";

export type StorytimeAuditPayload = {
  event: StorytimeAuditEvent;
  userId?: string;
  sessionId?: string;
  shareId?: string;
  provider?: string;
  safetyStatus?: string;
  quotaScope?: "hour" | "day";
  errorCode?: string;
  timestamp?: string;
};

export function auditLog(payload: StorytimeAuditPayload) {
  const safePayload: StorytimeAuditPayload = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString()
  };

  console.log(JSON.stringify({ service: "urai-storytime", ...safePayload }));
}
