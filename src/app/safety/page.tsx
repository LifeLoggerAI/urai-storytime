export default function SafetyPage() {
  return (
    <section className="card">
      <h1>Safety & child privacy</h1>
      <p>
        URAI Storytime is designed around parent control, private-by-default stories,
        local demo fallback, age-aware generation, safety prechecks, output checks,
        and human review for flagged content.
      </p>
      <ul>
        <li>Every prompt is checked before generation.</li>
        <li>Every generated story is checked before display or narration.</li>
        <li>Stories are private by default.</li>
        <li>Raw child story text is not sent to analytics.</li>
        <li>Admin review requires moderator or admin role claims.</li>
        <li>Memory seeds are opt-in, parent-controlled, redacted, and deletable.</li>
      </ul>
    </section>
  );
}
