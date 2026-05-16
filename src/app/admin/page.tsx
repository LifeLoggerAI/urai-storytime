export default function AdminPage() {
  return (
    <section className="card">
      <h1>Admin Console</h1>
      <p>Admin mode is role-gated in Cloud Family Mode. It coordinates safety reviews, moderation events, audit logs, system health, creator submissions, and privacy requests.</p>
      <div className="actions">
        <a className="btn" href="/admin/moderation">Open moderation queue</a>
        <a className="btn secondary" href="/admin/audit">View audit log</a>
      </div>
    </section>
  );
}
