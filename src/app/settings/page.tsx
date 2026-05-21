export default function SettingsPage() {
  return (
    <section className="card">
      <h1>Parent Settings</h1>
      <p>
        Parent settings are a launch-gated preview for bedtime mode, memory seed usage,
        sharing permissions, analytics consent, and data retention in Cloud Family Mode.
      </p>
      <p className="notice">
        These controls are not live account settings until Firebase Auth, Firestore rules,
        consent records, analytics controls, and data export/delete workflows are verified.
      </p>
      <ul>
        <li>Stories remain private by default.</li>
        <li>Memory seeds stay off unless a verified parent enables them in cloud mode.</li>
        <li>Analytics must exclude raw prompt and story body.</li>
        <li>Export/delete request flows remain launch-gated until cloud account storage is verified.</li>
      </ul>
      <a className="btn" href="/create">Use local demo</a>
    </section>
  );
}