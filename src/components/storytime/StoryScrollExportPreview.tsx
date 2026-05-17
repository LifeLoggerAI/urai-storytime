import type { WeeklyStoryScroll } from "@/lib/storytime/types";

export function StoryScrollExportPreview({ scroll }: { scroll: WeeklyStoryScroll }) {
  return (
    <section className="storytime-card">
      <p className="storytime-pill">Story Scroll Export</p>
      <h3>{scroll.title}</h3>
      <p>{scroll.weekStart} to {scroll.weekEnd}</p>
      <p>{scroll.summary}</p>
      <button className="storytime-button secondary" type="button">Prepare Export</button>
    </section>
  );
}
