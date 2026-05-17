import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">Magical · calm · family-safe</p>
        <h1>Bedtime stories that feel like a soft little universe.</h1>
        <p>
          URAI Storytime helps parents create gentle, age-aware stories with safety checks,
          narrator replay, scene prompts, and private-by-default family archives.
        </p>
        <div className="actions">
          <Link className="btn" href="/create">Create a story</Link>
          <Link className="btn secondary" href="/safety">See safety model</Link>
        </div>
      </div>
      <aside className="card">
        <h2>Launch mode</h2>
        <p>
          Local Demo Mode works without cloud credentials. Cloud Family Mode activates when Firebase Auth,
          Firestore, Functions, and rules are deployed.
        </p>
      </aside>
    </section>
  );
}
