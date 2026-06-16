import { redactForPublicShare } from "@/lib/storytime/redaction";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ shareId: "demo" }];
}

export default async function PublicStorySharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const title = redactForPublicShare(`Public-safe URAI Story ${shareId}`);

  return (
    <main className="storytime-shell">
      <div className="storytime-wrap">
        <nav className="storytime-nav">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links"><a href="/storytime">Create private story</a></div>
        </nav>
        <article className="storytime-hero">
          <p className="storytime-eyebrow">Public-safe share</p>
          <h1 className="storytime-title">{title}</h1>
          <p className="storytime-subtitle">
            This page is designed for redacted, consent-based public story shares. Exact private details are removed before a share is created.
          </p>
        </article>
      </div>
    </main>
  );
}
