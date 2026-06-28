"use client";

export function CloudSession({ sessionId }: { sessionId: string }) {
  return <section className="storytime-card"><h1>Cloud session</h1><p>{sessionId}</p></section>;
}
