import type { EmotionalArcSummary } from "@/lib/storytime/types";

export function EmotionalArcViewer({ arc }: { arc: EmotionalArcSummary }) {
  return (
    <section className="storytime-card">
      <p className="storytime-pill">Emotional Arc</p>
      <h3>{arc.arcLabel}</h3>
      <p>{arc.startTone} → {arc.peakTone} → {arc.resolutionTone}</p>
      <p>{arc.summary}</p>
      <p>{arc.caution}</p>
    </section>
  );
}
