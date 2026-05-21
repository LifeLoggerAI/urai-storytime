export default function PrivacyPage() {
  return (
    <section className="card">
      <h1>Privacy Policy</h1>
      <p>
        URAI Storytime is private by default. Local Demo Mode stores stories only in the current browser.
        Cloud Family Mode is a launch-gated preview for future family, child profile, story, safety,
        narration, and privacy-request records in Firebase with family-scoped rules.
      </p>
      <ul>
        <li>No raw child story text should be sent to analytics.</li>
        <li>Stories stay private unless a verified parent explicitly exports or shares them.</li>
        <li>Memory seeds remain opt-in, parent-controlled, redacted, fictionalized, and deletable.</li>
        <li>Privacy export and deletion request flows are modeled for cloud mode but are not live account workflows yet.</li>
      </ul>
      <p className="notice">
        Final public launch requires legal review, verified Firebase rules, consent records,
        data export/delete operations, and live privacy QA before making child/family compliance claims.
      </p>
    </section>
  );
}