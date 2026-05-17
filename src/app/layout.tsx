import './globals.css';
import type { Metadata } from 'next';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: 'URAI Storytime',
  description: 'Family-safe magical bedtime stories with privacy-first guardrails.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.uraistorytime.com'),
  openGraph: {
    title: 'URAI Storytime',
    description: 'Magical, calm, family-safe stories for bedtime and memory replay.',
    images: ['/og.svg']
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
