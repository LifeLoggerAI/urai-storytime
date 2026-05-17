export default function DemoPage() {
  return (
    <section className="card">
      <h1>Local Demo Mode</h1>
      <p>
        URAI Storytime can run without cloud credentials. Demo stories are generated safely in the browser,
        saved locally, and replayed with Web Speech narration fallback.
      </p>
      <a className="btn" href="/create">Open demo creator</a>
    </section>
  );
}
