export default function SettingsPage() {
  return (
    <section className="card">
      <h1>Parent Settings</h1>
      <p>Parent settings control bedtime mode, memory seed usage, sharing permissions, analytics consent, and data retention in Cloud Family Mode.</p>
      <ul>
        <li>Stories private by default.</li>
        <li>Memory seeds off unless parent enables them.</li>
        <li>Analytics excludes raw prompt and story body.</li>
        <li>Export/delete request flows are available in cloud mode.</li>
      </ul>
    </section>
  );
}
