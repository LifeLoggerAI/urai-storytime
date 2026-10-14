import { getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { storytimeJobsBridgeRequest, storytimeJobsBridgeTokenSecret } from "./storytime.js";
import { scanStorytimeVoiceoverRecovery } from "./storytime-voiceover-consent-admission.js";

// Deploy-safe and disabled until the approved staging/production recovery
// schedule is explicitly enabled by the operator. No paid Jobs are dispatched
// merely by merging this implementation.
export const reconcileStorytimeNarratorDispatches = onSchedule({
  schedule: "every 5 minutes",
  timeZone: "Etc/UTC",
  secrets: [storytimeJobsBridgeTokenSecret],
  timeoutSeconds: 240,
  memory: "256MiB",
}, async () => {
  if (process.env.URAI_STORYTIME_NARRATOR_RECOVERY_ENABLED !== "true") return;
  await scanStorytimeVoiceoverRecovery(getFirestore(), storytimeJobsBridgeRequest);
});
