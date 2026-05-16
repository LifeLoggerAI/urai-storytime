import Link from 'next/link';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="siteHeader">
        <Link className="brand" href="/">URAI Storytime</Link>
        <nav aria-label="Main navigation">
          <Link href="/demo">Demo</Link>
          <Link href="/safety">Safety</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/create">Create</Link>
          <Link href="/library">Library</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
      <footer className="siteFooter">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/contact">Contact</Link>
      </footer>
    </>
  );
}
