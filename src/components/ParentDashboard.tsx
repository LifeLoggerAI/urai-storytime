export function ParentDashboard() {
  return (
    <section className="grid">
      <article className="card">
        <h1>Parent Dashboard</h1>
        <p>
          Cloud mode is a launch-gated preview for family profiles, child settings, story archive,
          safety reviews, narrator preferences, privacy export, and subscription status. Local demo
          mode remains available without a login.
        </p>
        <p className="notice">
          Dashboard controls are not live account controls until Firebase Auth, Firestore rules,
          privacy export/delete workflows, and entitlement checks are verified end to end.
        </p>
        <a className="btn" href="/create">Create local demo story</a>
      </article>
      <article className="card">
        <h2>Family setup</h2>
        <p>Preview family workspace setup, child profiles, age bands, and bedtime defaults before cloud account creation is enabled.</p>
      </article>
      <article className="card">
        <h2>Privacy controls</h2>
        <p>Stories are private by default. Export and delete workflows remain launch-gated until account data storage is verified.</p>
      </article>
      <article className="card">
        <h2>Safety summary</h2>
        <p>Blocked or reviewed story attempts will appear here after authenticated moderation and audit workflows are live.</p>
      </article>
    </section>
  );
}