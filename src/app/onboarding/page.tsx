export default function OnboardingPage() {
  return (
    <section className="card">
      <h1>Family Onboarding</h1>
      <p>Cloud onboarding creates a parent account, family workspace, child profile, age band, narrator preference, privacy settings, and first story. Local demo users can start immediately without an account.</p>
      <ol>
        <li>Create parent account.</li>
        <li>Create family workspace.</li>
        <li>Add child profile and age band.</li>
        <li>Choose narrator and bedtime defaults.</li>
        <li>Create the first story.</li>
      </ol>
      <a className="btn" href="/create">Create first story</a>
    </section>
  );
}
