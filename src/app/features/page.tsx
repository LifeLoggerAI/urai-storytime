export default function FeaturesPage() {
  return (
    <section className="card">
      <h1>Features</h1>
      <div className="grid three">
        <article className="storyCard"><h2>Safe story creation</h2><p>Prompt prechecks, age-band rules, and output postchecks protect the experience.</p></article>
        <article className="storyCard"><h2>Scene replay</h2><p>Stories become replayable scenes with captions, motifs, and illustration prompts.</p></article>
        <article className="storyCard"><h2>Private archive</h2><p>Local demo storage is browser-only; cloud mode is private by family membership.</p></article>
      </div>
    </section>
  );
}
