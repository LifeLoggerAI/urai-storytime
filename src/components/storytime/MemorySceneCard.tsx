import type { MemoryScene } from "@/lib/storytime/types";

export function MemorySceneCard({ scene }: { scene: MemoryScene }) {
  return (
    <article className="storytime-card">
      <p className="storytime-pill">Memory Scene</p>
      <h3>{scene.title}</h3>
      <p>{scene.scenePrompt}</p>
      <p>Visual mood: {scene.visualMood}. Audio mood: {scene.audioMood}.</p>
    </article>
  );
}
