export function AdminModerationQueue() {
  const demoItems = [
    {
      id: 'mod_demo_1',
      targetType: 'prompt',
      severity: 'medium',
      reason: 'Blocked demo safety term',
      status: 'pending'
    }
  ];

  return (
    <section className="card">
      <h1>Moderation Queue</h1>
      <p>
        Admin and moderator roles review blocked prompts, unsafe outputs, creator submissions,
        and escalated family safety events.
      </p>
      <div className="grid">
        {demoItems.map((item) => (
          <article className="storyCard" key={item.id}>
            <h2>{item.targetType}</h2>
            <p>Severity: {item.severity}</p>
            <p>Reason: {item.reason}</p>
            <p>Status: {item.status}</p>
            <div className="actions">
              <button>Approve</button>
              <button>Reject</button>
              <button>Escalate</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
