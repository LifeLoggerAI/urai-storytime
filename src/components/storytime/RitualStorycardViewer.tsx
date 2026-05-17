import type { RitualStorycard } from "@/lib/storytime/types";

export function RitualStorycardViewer({ card }: { card: RitualStorycard }) {
  return (
    <section className="storytime-card">
      <p className="storytime-pill">Ritual Storycard</p>
      <h3>{card.title}</h3>
      <p>{card.prompt}</p>
      <blockquote className="storytime-quote">{card.narratorLine}</blockquote>
    </section>
  );
}
