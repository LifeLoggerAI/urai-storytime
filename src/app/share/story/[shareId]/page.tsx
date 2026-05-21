import { redactForPublicShare } from "@/lib/storytime/redaction";

export const dynamicParams = false;

const MAX_SHARE_ID_CHARS = 64;

function normalizeShareId(value: string) {
  return value.trim().slice(0, MAX_SHARE_ID_CHARS) || "demo";
}

export function generateStaticParams() {
  return [{ shareId: "demo" }];
}

export default async function PublicStorySharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const safeShareId = normalizeShareId(shareId);
  const title = redactForPublicShare(`Public-safe URAI Story ${safeShareId}`);

  return (
    <main className="storytime-shell">
      <div className="storytime-wrap">
        <nav className="storytime-nav">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links"><a href="/storytime">Create private story</a></div>
        </nav>
        <article className="storytime-hero">
          <p className="storytime-eyebrow">Public-safe share demo</p>
          <h1 className="storytime-title">{title}</h1>
          <p className="storytime-subtitle">
            This demo page shows the intended shell for redacted, consent-based public story shares. Real public links must stay disabled until consent, redaction, revocation, and Firestore security rules are verified end to end.
          </p>
        </article>
        <section className="storytime-grid" aria-label="Public share safety boundaries">
          <article className="storytime-card">
            <h2>Consent required</h2>
            <p>Stories remain private unless the signed-in owner explicitly creates a public-safe share.</p>
          </article>
          <article className="storytime-card">
            <h2>Redacted by design</h2>
            <p>Names, addresses, phone numbers, and emails must be removed before public display.</p>
          </article>
          <article className="storytime-card">
            <h2>Revocable</h2>
            <p>Production shares must support revocation and must not expose private story records directly.</p>
          </article>
        </section>
      </div>
    </main>
  );
}