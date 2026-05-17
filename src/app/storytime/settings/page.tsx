import { StorySettings } from "@/components/storytime/StorySettings";

export default function StorytimeSettingsPage() {
  return (
    <main className="storytime-shell">
      <div className="storytime-wrap">
        <nav className="storytime-nav">
          <a className="storytime-brand" href="/storytime">URAI Storytime</a>
          <div className="storytime-links"><a href="/storytime">Home</a></div>
        </nav>
        <StorySettings />
      </div>
    </main>
  );
}
