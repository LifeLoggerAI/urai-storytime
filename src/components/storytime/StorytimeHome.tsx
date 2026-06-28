"use client";

import { FormEvent, useState } from "react";

const MAX_DEMO_SOURCE_CHARS = 1200;

export function StorytimeHome() {
  const [title, setTitle] = useState("A Quiet Signal Became a Story");
  const [sourceText, setSourceText] = useState("");

  function handleCreateStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim() || "Untitled Story Session";
    const cleanSource = sourceText.trim().slice(0, MAX_DEMO_SOURCE_CHARS);
    const params = new URLSearchParams({ title: cleanTitle });

    if (cleanSource) {
      params.set("source", cleanSource);
    }

    window.location.assign(`/storytime/demo?${params.toString()}`);
  }

  return (
    <main className="storytime-shell">
      <div className="storytime-wrap">
        <nav className="storytime-nav">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links">
            <a href="/storytime/settings">Settings</a>
          </div>
        </nav>

        <section className="storytime-hero">
          <p className="storytime-eyebrow">URAI Narrative Engine</p>
          <h1 className="storytime-title">Your life signals, shaped into private story replays.</h1>
          <p className="storytime-subtitle">
            Storytime turns opted-in URAI memories, moods, rituals, relationship threads, and timeline moments into gentle chapters, narrator scripts, emotional arcs, and shareable storycards.
          </p>
        </section>

        <section className="storytime-grid" aria-label="Storytime values">
          {[
            ["Private by default", "Stories stay private unless you explicitly create a public-safe share."],
            ["Narrator-ready", "Every chapter can become a warm, grounded narrator script."],
            ["System-aware", "Designed to connect with URAI mood, memory, ritual, timeline, and companion layers."]
          ].map(([heading, body]) => (
            <article key={heading} className="storytime-card">
              <h2>{heading}</h2>
              <p>{body}</p>
            </article>
          ))}
        </section>

        <form className="storytime-card storytime-form" onSubmit={handleCreateStory}>
          <h2>Create a private story seed</h2>
          <label className="storytime-field">
            Story title
            <input className="storytime-input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="storytime-field">
            Optional source text
            <textarea
              className="storytime-input"
              rows={6}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste a private moment, weekly reflection, or story seed."
            />
          </label>
          <button className="storytime-button" type="submit" disabled={!title.trim()}>
            Open Demo Story Session
          </button>
          <p>
            Cloud-generation callable functions exist in the backend scaffold, but this form does not call them until
            Firebase env vars, auth, and client wiring are configured. Until then, this form opens a private demo
            session from the title and source text you provide.
          </p>
        </form>
      </div>
    </main>
  );
}
