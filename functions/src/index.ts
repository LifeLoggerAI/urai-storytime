
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

admin.initializeApp();

const db = admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;

type IngestEventInput = {
  familyId: string;
  childId: string;
  type: string;
  timestamp: string | number;
  payload: Record<string, unknown>;
};

function requireAuth(auth: { uid?: string } | null | undefined): string {
  const uid = auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "auth required");
  return uid;
}

function normalizeTimestamp(input: string | number): Timestamp {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      throw new HttpsError("invalid-argument", "timestamp must be finite");
    }
    return Timestamp.fromMillis(input);
  }

  if (typeof input === "string") {
    const ms = Date.parse(input);
    if (Number.isNaN(ms)) {
      throw new HttpsError("invalid-argument", "timestamp string is invalid");
    }
    return Timestamp.fromMillis(ms);
  }

  throw new HttpsError("invalid-argument", "timestamp is required");
}

function toDayKey(ts: Timestamp): string {
  const d = ts.toDate();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function toWeekKey(ts: Timestamp): string {
  const d = ts.toDate();
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}W${String(weekNo).padStart(2, "0")}`;
}

export const ingestEvent = onCall<IngestEventInput>(async (request) => {
  const uid = requireAuth(request.auth);
  const data = request.data;

  // Validate the input data
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "data is required");
  }

  const { familyId, childId, type, payload } = data;

  if (!familyId || typeof familyId !== "string") {
    throw new HttpsError("invalid-argument", "familyId is required");
  }
  if (!childId || typeof childId !== "string") {
    throw new HttpsError("invalid-argument", "childId is required");
  }
  if (!type || typeof type !== "string") {
    throw new HttpsError("invalid-argument", "type is required");
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpsError("invalid-argument", "payload must be an object");
  }

  // Verify that the user is a guardian of the family
  const familyRef = db.collection("families").doc(familyId);
  const familySnap = await familyRef.get();
  const familyData = familySnap.data();

  if (!familySnap.exists || !familyData || !familyData.guardianIds.includes(uid)) {
    throw new HttpsError("permission-denied", "user is not a guardian of this family");
  }

  const timestamp = normalizeTimestamp(data.timestamp);
  const eventRef = db.collection("families").doc(familyId).collection("children").doc(childId).collection("events").doc();

  const eventDoc = {
    guardianId: uid,
    familyId,
    childId,
    type,
    timestamp,
    payload,
    createdAt: FieldValue.serverTimestamp()
  };

  const userEventDoc = {
    eventId: eventRef.id,
    guardianId: uid,
    familyId,
    childId,
    type,
    timestamp,
    createdAt: FieldValue.serverTimestamp()
  };

  const batch = db.batch();
  batch.set(eventRef, eventDoc);
  batch.set(db.collection("users").doc(uid).collection("events").doc(eventRef.id), userEventDoc);
  await batch.commit();

  return {
    ok: true,
    eventId: eventRef.id
  };
});

export const onEventCreate = onDocumentCreated("families/{familyId}/children/{childId}/events/{eventId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const data = snap.data() as {
    guardianId?: string;
    timestamp?: admin.firestore.Timestamp;
  };

  if (!data.guardianId) {
    await snap.ref.set(
      {
        pipelineError: "missing_guardianId",
        pipelineCheckedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    return;
  }

  const ts = data.timestamp instanceof Timestamp ? data.timestamp : Timestamp.now();
  const normalized = Timestamp.fromMillis(ts.toMillis());

  await snap.ref.set(
    {
      timestamp: normalized,
      ingestedAt: FieldValue.serverTimestamp(),
      dayKey: toDayKey(normalized),
      weekKey: toWeekKey(normalized)
    },
    { merge: true }
  );

  await db
    .collection("users")
    .doc(data.guardianId)
    .collection("events")
    .doc(snap.id)
    .set(
      {
        dayKey: toDayKey(normalized),
        weekKey: toWeekKey(normalized),
        ingestedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
});
