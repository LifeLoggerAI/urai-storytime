const demoItems = [
  {
    id: 'mod_demo_1',
    targetType: 'prompt',
    severity: 'medium',
    reason: 'Blocked demo safety term',
    status: 'pending'
  }
];

export function AdminModerationQueue() {
  return (
    <section className="card">
      <h1>Moderation Queue</h1>
      <p>
        Admin and moderator roles review blocked prompts, unsafe outputs, creator submissions,
        and escalated family safety events.
      </p>
      <p className="notice">
        Demo-only queue. Moderation actions stay disabled until authenticated admin roles,
        audit logging, Firestore writes, and escalation workflows are verified end to end.
      </p>
      <div className="grid">
        {demoItems.map((item) => (
          <article className="storyCard" key={item.id}>
            <h2>{item.targetType}</h2>
            <p>Severity: {item.severity}</p>
            <p>Reason: {item.reason}</p>
            <p>Status: {item.status}</p>
            <div className="actions" aria-label="Disabled demo moderation actions">
              <button disabled title="Demo only: approval requires verified admin auth and audit logging">Approve</button>
              <button disabled title="Demo only: rejection requires verified admin auth and audit logging">Reject</button>
              <button disabled title="Demo only: escalation requires verified workflows and audit logging">Escalate</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}