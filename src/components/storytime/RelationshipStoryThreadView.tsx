import type { RelationshipStoryThread } from "@/lib/storytime/types";

export function RelationshipStoryThreadView({ thread }: { thread: RelationshipStoryThread }) {
  return (
    <section className="storytime-card">
      <p className="storytime-pill">Relationship Thread</p>
      <h3>{thread.threadTitle}</h3>
      <p>{thread.safeReflection}</p>
      <p>Pattern: {thread.emotionalPattern}. Label: {thread.displayLabel}.</p>
    </section>
  );
}
