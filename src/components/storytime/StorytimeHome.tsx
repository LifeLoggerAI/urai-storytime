"use client";

import { useState } from "react";

export function StorytimeHome() {
  const [title, setTitle] = useState("A Quiet Signal Became a Story");
  const [sourceText, setSourceText] = useState("");

  return (
    <main className="storytime-shell">
      <div className="storytime-wrap">
        <nav className="storytime-nav">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links">
            <a href="/storytime/settings">Settings</a>
            <a href="/">Legacy demo</a>
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

        <form className="storytime-card storytime-form">
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
          <button className="storytime-button" type="button">
            Generate Story Session
          </button>
          <p>
            Cloud generation is wired through Firebase callable functions once Firebase env vars and auth are configured. This UI intentionally remains privacy-clear while deployment is completed.
          </p>
        </form>
      </div>
    </main>
  );
}
