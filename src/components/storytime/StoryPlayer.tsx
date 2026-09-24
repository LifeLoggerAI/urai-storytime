import type { NarratorScript, StoryChapter, StoryMoment, StorySession } from "@/lib/storytime/types";
import { NarratorBubble } from "./NarratorBubble";

export function StoryPlayer({
  session,
  chapters,
  moments,
  narratorScripts
}: {
  session: StorySession;
  chapters: StoryChapter[];
  moments: StoryMoment[];
  narratorScripts: NarratorScript[];
}) {
  return (
    <article className="storytime-card storytime-stack">
      <p className="storytime-pill">Story Replay{session.currentVersionNumber ? ` · Version ${session.currentVersionNumber}` : ""}</p>
      <h1>{session.title}</h1>
      <p>{session.whyGenerated}</p>
      {chapters.map((chapter) => {
        const script = narratorScripts.find((item) => item.id === chapter.narratorScriptId);
        const chapterMoments = moments
          .filter((moment) => moment.chapterId === chapter.id)
          .sort((left, right) => left.order - right.order);

        return (
          <section className="storytime-card storytime-stack" key={chapter.id}>
            <h2>{chapter.title}</h2>
            <p>{chapter.summary}</p>
            {chapterMoments.map((moment) => (
              <section key={moment.id}>
                <h3>{moment.title}</h3>
                <p>{moment.body}</p>
              </section>
            ))}
            {script ? <NarratorBubble script={script} /> : null}
          </section>
        );
      })}
    </article>
  );
}
