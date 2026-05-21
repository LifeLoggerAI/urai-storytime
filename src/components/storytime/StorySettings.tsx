import type { UserStoryPreferences } from "@/lib/storytime/types";

const settingRows = [
  ["Memory use", "allowMemoryUse", "Off by default", "Requires explicit opt-in before URAI memories can shape a story."],
  ["Relationship threads", "allowRelationshipThreads", "Off by default", "Requires explicit opt-in before relationship context can be used."],
  ["Voiceover jobs", "allowVoiceoverJobs", "Off by default", "Queued voiceover generation stays disabled until provider and consent checks are live."],
  ["Public sharing", "allowPublicSharing", "Requires explicit consent", "Public-safe shares require consent, redaction, and safety review."]
] as const;

export function StorySettings({ preferences }: { preferences?: Partial<UserStoryPreferences> }) {
  const narratorTone = preferences?.defaultNarratorTone || "warm";

  return (
    <section className="storytime-card storytime-stack">
      <p className="storytime-pill">Story Settings</p>
      <h1>Privacy and narrator controls</h1>
      <p>
        Storytime is private by default. These controls describe the current effective defaults until authenticated,
        persisted user preferences are connected.
      </p>
      <div className="storytime-grid" aria-label="Storytime privacy controls">
        <article className="storytime-card">
          <h2>Narrator tone</h2>
          <p>{narratorTone}</p>
        </article>
        {settingRows.map(([label, key, disabledLabel, detail]) => {
          const enabled = Boolean(preferences?.[key]);

          return (
            <article className="storytime-card" key={key}>
              <h2>{label}</h2>
              <p>{enabled ? "Allowed" : disabledLabel}</p>
              <p>{detail}</p>
            </article>
          );
        })}
      </div>
      <p>
        This page is intentionally read-only in the demo build. Do not treat these settings as live account controls until
        Firebase auth, Firestore persistence, security rules, and privacy/legal review are verified.
      </p>
    </section>
  );
}