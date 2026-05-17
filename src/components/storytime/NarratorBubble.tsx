import type { NarratorScript } from "@/lib/storytime/types";

export function NarratorBubble({ script }: { script: NarratorScript }) {
  return (
    <div className="storytime-card">
      <p className="storytime-pill">URAI Narrator · {script.voiceTone}</p>
      <p className="storytime-quote">{script.text}</p>
      <p>Safety: {script.safetyStatus}. Reflective storytelling only, not diagnosis or clinical interpretation.</p>
    </div>
  );
}
