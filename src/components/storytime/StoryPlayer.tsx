import type { NarratorScript, StoryChapter, StorySession } from "@/lib/storytime/types";
import { NarratorBubble } from "./NarratorBubble";

export function StoryPlayer({
  session,
  chapters,
  narratorScripts
}: {
  session: StorySession;
  chapters: StoryChapter[];
  narratorScripts: NarratorScript[];
}) {
  return (
    <article className="storytime-card storytime-stack">
      <p className="storytime-pill">Story Replay</p>
      <h1>{session.title}</h1>
      <p>{session.whyGenerated}</p>
      {chapters.map((chapter) => {
        const script = narratorScripts.find((item) => item.id === chapter.narratorScriptId);
        return (
          <section className="storytime-card" key={chapter.id}>
            <h2>{chapter.title}</h2>
            <p>{chapter.summary}</p>
            {script ? <NarratorBubble script={script} /> : null}
          </section>
        );
      })}
    </article>
  );
}
