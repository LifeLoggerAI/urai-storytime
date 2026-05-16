export default function ParentsPage() {
  return (
    <section className="card">
      <h1>For Parents</h1>
      <p>URAI Storytime is parent-controlled, calm by design, and private by default. Parents choose age bands, narrator style, bedtime mode, sharing permissions, and memory seed usage before cloud mode stores anything.</p>
      <div className="grid three">
        <article className="storyCard"><h2>Age-aware</h2><p>Story tone, length, and emotional intensity adapt to the selected age band.</p></article>
        <article className="storyCard"><h2>Private archive</h2><p>Stories stay local in demo mode and family-scoped in cloud mode.</p></article>
        <article className="storyCard"><h2>Safe before magical</h2><p>Prompt and output checks run before replay, narration, saving, or sharing.</p></article>
      </div>
    </section>
  );
}
