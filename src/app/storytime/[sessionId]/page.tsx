import { ChapterTimeline } from "@/components/storytime/ChapterTimeline";
import { EmotionalArcViewer } from "@/components/storytime/EmotionalArcViewer";
import { MemorySceneCard } from "@/components/storytime/MemorySceneCard";
import { RelationshipStoryThreadView } from "@/components/storytime/RelationshipStoryThreadView";
import { RitualStorycardViewer } from "@/components/storytime/RitualStorycardViewer";
import { StoryPlayer } from "@/components/storytime/StoryPlayer";
import { StoryScrollExportPreview } from "@/components/storytime/StoryScrollExportPreview";
import { buildStorySession } from "@/lib/storytime/story-builder";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ sessionId: "demo" }];
}

export default async function StorySessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const story = buildStorySession({
    userId: "demo-user",
    title: `Story Session ${sessionId}`,
    sourceText: "A quiet URAI signal became a private story replay, with each moment handled gently and kept private by default.",
    emotionalTone: "reflective",
    symbolicMotifs: ["star", "path", "soft glow"],
    sourceSignals: ["demo story seed"]
  });

  const thread = {
    id: "relationshipThread_demo",
    userId: "demo-user",
    sessionId: story.session.id,
    relationshipKey: "demo",
    displayLabel: "someone important",
    threadTitle: "A gentle connection thread",
    emotionalPattern: "steady return",
    safeReflection: "This thread describes observable warmth and rhythm without guessing intent or making accusations.",
    momentIds: story.moments.map((moment) => moment.id),
    redacted: true,
    createdAt: story.session.createdAt,
    updatedAt: story.session.updatedAt
  };

  const ritual = {
    id: "ritual_demo",
    userId: "demo-user",
    sessionId: story.session.id,
    title: "Return to the Small Star",
    ritualType: "reflection",
    prompt: "Take one quiet breath and name the part of the story that felt most true.",
    visualMotif: "small star",
    narratorLine: "You do not need to solve the whole sky tonight. One small star is enough.",
    createdAt: story.session.createdAt,
    updatedAt: story.session.updatedAt
  };

  const scroll = {
    id: "weeklyScroll_demo",
    userId: "demo-user",
    weekStart: "private",
    weekEnd: "private",
    title: "A Week of Quiet Signals",
    summary: "A private weekly scroll prepared for export only after consent and redaction.",
    sessionIds: [story.session.id],
    createdAt: story.session.createdAt,
    updatedAt: story.session.updatedAt
  };

  return (
    <main className="storytime-shell">
      <div className="storytime-wrap storytime-stack">
        <nav className="storytime-nav">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links"><a href="/storytime/settings">Settings</a></div>
        </nav>
        <StoryPlayer session={story.session} chapters={story.chapters} narratorScripts={story.narratorScripts} />
        <section className="storytime-grid">
          <ChapterTimeline chapters={story.chapters} />
          <MemorySceneCard scene={story.scenes[0]} />
          <EmotionalArcViewer arc={story.arc} />
        </section>
        <section className="storytime-grid">
          <RelationshipStoryThreadView thread={thread} />
          <RitualStorycardViewer card={ritual} />
          <StoryScrollExportPreview scroll={scroll} />
        </section>
      </div>
    </main>
  );
}
