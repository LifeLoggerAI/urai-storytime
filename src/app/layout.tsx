import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "URAI Storytime",
  description: "Private URAI story replays, narrator scripts, emotional arcs, and public-safe storycards.",
  openGraph: {
    title: "URAI Storytime",
    description: "Turn opted-in URAI memories and emotional signals into private story replays.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
