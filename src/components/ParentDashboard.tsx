export function ParentDashboard() {
  return (
    <section className="grid">
      <article className="card">
        <h1>Parent Dashboard</h1>
        <p>
          Cloud mode connects family profiles, child settings, story archive, safety reviews,
          narrator preferences, privacy export, and subscription status. Local demo mode remains
          available without a login.
        </p>
      </article>
      <article className="card">
        <h2>Family setup</h2>
        <p>Create a family workspace, add child profiles, choose age bands, and set bedtime defaults.</p>
      </article>
      <article className="card">
        <h2>Privacy controls</h2>
        <p>Stories are private by default. Export and delete requests are available from settings.</p>
      </article>
      <article className="card">
        <h2>Safety summary</h2>
        <p>Blocked or reviewed story attempts appear here without exposing unsafe content unnecessarily.</p>
      </article>
    </section>
  );
}
