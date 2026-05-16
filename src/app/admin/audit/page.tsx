export default function AdminAuditPage() {
  return (
    <section className="card">
      <h1>Admin Audit Log</h1>
      <p>Every moderator/admin review action writes an append-only audit record with actor, action, target, reason, and timestamp. Live audit data requires Firebase Auth custom claims and Firestore deployment.</p>
    </section>
  );
}
