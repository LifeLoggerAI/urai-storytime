export default function OnboardingPage() {
  return (
    <section className="card">
      <h1>Family Onboarding</h1>
      <p>
        Family onboarding is currently a preview of the future cloud setup flow. Local demo users
        can start immediately without an account.
      </p>
      <p className="notice">
        Live onboarding remains disabled until account setup, family workspace setup, privacy
        settings, recovery, and data controls are verified end to end.
      </p>
      <ol>
        <li>Preview parent account setup.</li>
        <li>Preview family workspace setup.</li>
        <li>Preview child profile and age band setup.</li>
        <li>Preview narrator and bedtime defaults.</li>
        <li>Create a local demo story.</li>
      </ol>
      <a className="btn" href="/create">Create local demo story</a>
    </section>
  );
}