export default function SignupPage() {
  return (
    <section className="card">
      <h1>Signup</h1>
      <p>
        Cloud Family Mode signup is launch-gated until Firebase Auth, family bootstrap,
        child profile setup, parent privacy settings, consent records, and account recovery
        are verified end to end.
      </p>
      <p className="notice">
        This page is a preview only. Do not enter real child-sensitive information until live
        account creation, privacy controls, and data deletion/export workflows are approved.
      </p>
      <div className="actions">
        <a className="btn" href="/create">Use local demo</a>
        <a className="btn secondary" href="/onboarding">Preview onboarding</a>
      </div>
    </section>
  );
}