import { CloudSession } from "@/components/storytime/CloudSession";
import { StoryPlayer } from "@/components/storytime/StoryPlayer";
import { buildStorySession } from "@/lib/storytime/story-builder";

const MAX_DEMO_SOURCE_CHARS = 1200;
const MAX_DEMO_TITLE_CHARS = 120;

type StorySearchParams = {
  title?: string | string[];
  source?: string | string[];
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeQueryText(value: string | string[] | undefined, fallback: string, maxLength: number) {
  const normalized = firstQueryValue(value)?.trim();
  return (normalized || fallback).slice(0, maxLength);
}

export function generateStaticParams() {
  return [{ sessionId: "demo" }];
}

export default async function StorySessionPage({
  params,
  searchParams
}: {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<StorySearchParams>;
}) {
  const { sessionId } = await params;
  const query = searchParams ? await searchParams : {};

  return (
    <main className="storytime-shell">
      <div className="storytime-wrap storytime-stack">
        <nav className="storytime-nav">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links"><a href="/storytime/settings">Settings</a></div>
        </nav>
        {sessionId === "demo" ? <DemoSession query={query} /> : <CloudSession sessionId={sessionId} />}
      </div>
    </main>
  );
}

function DemoSession({ query }: { query: StorySearchParams }) {
  const story = buildStorySession({
    userId: "demo-user",
    title: normalizeQueryText(query.title, "Demo Story Session", MAX_DEMO_TITLE_CHARS),
    sourceText: normalizeQueryText(query.source, "A private demo story seed became a small replay.", MAX_DEMO_SOURCE_CHARS),
    emotionalTone: "reflective",
    symbolicMotifs: ["star", "path", "soft glow"],
    sourceSignals: ["demo story seed"]
  });

  return (
    <section className="storytime-stack">
      <article className="storytime-card storytime-stack">
        <p className="storytime-pill">Demo mode</p>
        <h2>Deterministic demo session</h2>
        <p className="storytime-helper">This route is local and deterministic. It is not saved to a user account and does not prove provider generation.</p>
      </article>
      <StoryPlayer session={story.session} chapters={story.chapters} narratorScripts={story.narratorScripts} />
    </section>
  );
}
