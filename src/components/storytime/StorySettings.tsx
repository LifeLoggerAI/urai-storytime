import type { UserStoryPreferences } from "@/lib/storytime/types";

export function StorySettings({ preferences }: { preferences?: Partial<UserStoryPreferences> }) {
  return (
    <section className="storytime-card storytime-stack">
      <p className="storytime-pill">Story Settings</p>
      <h1>Privacy and narrator controls</h1>
      <p>Default narrator tone: {preferences?.defaultNarratorTone || "warm"}</p>
      <p>Memory use: {preferences?.allowMemoryUse ? "Allowed" : "Off by default"}</p>
      <p>Relationship threads: {preferences?.allowRelationshipThreads ? "Allowed" : "Off by default"}</p>
      <p>Voiceover jobs: {preferences?.allowVoiceoverJobs ? "Allowed" : "Off by default"}</p>
      <p>Public sharing: {preferences?.allowPublicSharing ? "Allowed" : "Requires explicit consent"}</p>
    </section>
  );
}
