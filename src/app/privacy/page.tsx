export default function PrivacyPage() {
  return (
    <section className="card">
      <h1>Privacy Policy</h1>
      <p>URAI Storytime is private by default. Local Demo Mode stores stories only in the current browser. Cloud Family Mode stores family, child profile, story, safety, narration, and privacy-request records in Firebase with family-scoped rules.</p>
      <ul>
        <li>No raw child story text is sent to analytics.</li>
        <li>Stories are private unless a parent explicitly exports or shares them.</li>
        <li>Memory seeds are opt-in, parent-controlled, redacted, fictionalized, and deletable.</li>
        <li>Privacy export and deletion request flows are modeled for cloud mode.</li>
      </ul>
      <p className="notice">Final public launch requires legal review before making child/family compliance claims.</p>
    </section>
  );
}
