import type { StoryChapter } from "@/lib/storytime/types";

export function ChapterTimeline({ chapters }: { chapters: StoryChapter[] }) {
  return (
    <nav className="storytime-card" aria-label="Story chapters">
      <h2>Chapter Timeline</h2>
      <ol className="storytime-timeline">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <span className="storytime-dot">{chapter.order}</span>
            <div>
              <strong>{chapter.title}</strong>
              <p>{chapter.emotionalTone}</p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
