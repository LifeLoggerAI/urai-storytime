import type { StoryVersion } from "@/lib/storytime/types";

function shortHash(value: string) {
  return value.length > 16 ? `${value.slice(0, 12)}…${value.slice(-4)}` : value;
}

export function StoryVersionHistory({ versions }: { versions: StoryVersion[] }) {
  const ordered = [...versions].sort((left, right) => right.versionNumber - left.versionNumber);

  return (
    <section className="storytime-card storytime-stack" aria-label="Story version history">
      <p className="storytime-pill">Version history</p>
      <h2>Immutable story versions</h2>
      <p className="storytime-helper">
        Each committed version is retained as a separate server-created snapshot. Editing or regeneration must create a new
        version rather than silently overwriting an earlier story.
      </p>
      {ordered.length === 0 ? (
        <p>No immutable version snapshot is available for this story yet.</p>
      ) : (
        <ol className="storytime-stack">
          {ordered.map((version) => (
            <li key={version.id} className="storytime-card">
              <strong>Version {version.versionNumber}</strong>
              <p>{version.reason.replace(/_/g, " ")}</p>
              <p className="storytime-helper">
                {new Date(version.createdAt).toLocaleString()} · SHA-256 {shortHash(version.contentSha256)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
