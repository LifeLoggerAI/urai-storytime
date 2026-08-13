import { CloudSession } from "@/components/storytime/CloudSession";

export default async function StorySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <main className="storytime-shell">
      <div className="storytime-wrap storytime-stack">
        <nav className="storytime-nav" aria-label="Storytime">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links"><a href="/storytime/settings">Settings</a></div>
        </nav>
        <CloudSession sessionId={sessionId} />
      </div>
    </main>
  );
}
