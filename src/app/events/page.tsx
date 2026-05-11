"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";

type EventRow = {
  id: string;
  type?: string;
  timestamp?: { seconds?: number; nanoseconds?: number } | string | number;
  createdAt?: { seconds?: number; nanoseconds?: number };
  dayKey?: string;
  weekKey?: string;
  ingestedAt?: { seconds?: number; nanoseconds?: number };
};

function formatTs(value: EventRow["timestamp"]) {
  if (!value) return "—";
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }
  return "—";
}

export default function EventsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [status, setStatus] = useState("booting");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        await signInAnonymously(auth);
        return;
      }
      setUid(user.uid);
      setStatus("authed");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;
    setStatus("loading");
    const q = query(
      collection(db, "users", uid, "events"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventRow, "id">) })));
      setStatus("live");
    });
    return () => unsub();
  }, [uid]);

  const ingest = useMemo(() => httpsCallable(functions, "ingestEvent"), []);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>URAI Events</h1>
      <p>Status: {status}</p>
      <p>User: {uid ?? "—"}</p>
      <button
        onClick={async () => {
          setStatus("ingesting");
          await ingest({
            type: "manual_test_event",
            timestamp: new Date().toISOString(),
            payload: { source: "events_page", note: "proof_of_life" }
          });
          setStatus("live");
        }}
        style={{ padding: "10px 14px", cursor: "pointer", marginBottom: 20 }}
      >
        Send Test Event
      </button>
      <ul style={{ padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
        {rows.map((row) => (
          <li key={row.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <div><strong>{row.type ?? "unknown"}</strong></div>
            <div>eventId: {row.id}</div>
            <div>timestamp: {formatTs(row.timestamp)}</div>
            <div>dayKey: {row.dayKey ?? "—"}</div>
            <div>weekKey: {row.weekKey ?? "—"}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
