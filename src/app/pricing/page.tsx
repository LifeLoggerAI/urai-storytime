export default function PricingPage() {
  return (
    <section className="card">
      <h1>Pricing</h1>
      <p className="notice">
        Billing activates only after Stripe credentials, webhooks, and entitlement checks are deployed.
        Until then, URAI Storytime runs as a free demo/waitlist experience.
      </p>
      <div className="grid three">
        <article className="price">
          <h2>Free Demo</h2>
          <p className="priceTag">$0</p>
          <p>Local browser stories, local archive, Web Speech narration fallback.</p>
          <a className="btn" href="/create">Use demo</a>
        </article>
        <article className="price">
          <h2>Family Pro</h2>
          <p className="priceTag">Prepared</p>
          <p>Cloud library, child profiles, narrator jobs, privacy export/delete, and family settings.</p>
          <button disabled>Requires Stripe deploy</button>
        </article>
        <article className="price">
          <h2>Schools</h2>
          <p className="priceTag">Contact</p>
          <p>Admin controls, moderation, org policies, and safety reporting.</p>
          <a className="btn secondary" href="/contact">Contact</a>
        </article>
      </div>
    </section>
  );
}
