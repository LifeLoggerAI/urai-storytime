import type { DocumentReference, Firestore } from "firebase-admin/firestore";

// A commit error may mean the acknowledgement was lost after an atomic write.
// Read the request and output in a transaction before recording a terminal hold.
export async function reconcileStoryPersistence(args: {
  db: Pick<Firestore, "runTransaction">;
  requestRef: DocumentReference;
  sessionRef: DocumentReference;
  deadLetterRef: DocumentReference;
  userId: string;
  requestId: string;
  sessionId: string;
  reservationId: string | null;
  dayId: string | null;
  timestamp: string;
}): Promise<boolean> {
  return args.db.runTransaction(async (transaction) => {
    const [request, session] = await Promise.all([
      transaction.get(args.requestRef), transaction.get(args.sessionRef)
    ]);
    const data = request.data();
    const output = session.data();
    if (data?.userId !== args.userId) throw new Error("persistence_request_unavailable");
    if (data.status === "succeeded" && data.sessionId === args.sessionId
      && session.exists && output?.userId === args.userId && output?.requestId === args.requestId) {
      return true;
    }
    // Never convert a successful request into a failure, even if its output
    // needs separate investigation (for example, concurrent deletion).
    if (data.status !== "succeeded") {
      transaction.set(args.requestRef, {
        status: "requires_reconciliation",
        errorCode: "story_persistence_failed",
        retryAuthorized: false,
        updatedAt: args.timestamp
      }, { merge: true });
    }
    transaction.set(args.deadLetterRef, {
      schemaVersion: "storytime-provider-dead-letter-v1",
      userId: args.userId,
      requestId: args.requestId,
      reservationId: args.reservationId,
      dayId: args.dayId,
      sessionId: args.sessionId,
      status: "requires_provider_receipt_reconciliation",
      failureCode: "story_persistence_failed",
      containsRawStoryContent: false,
      retryAuthorized: false,
      createdAt: args.timestamp,
      updatedAt: args.timestamp
    }, { merge: true });
    return false;
  });
}
