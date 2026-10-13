import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://renzoloenterprises.com"),
  title: { default: "RENZOLO · Venture readiness for founders", template: "%s · RENZOLO" },
  description:
    "RENZOLO™ gives founders and suppliers a comprehensive view of where their business stands, a readiness and growth plan, and coaching to reach the level partners, investors and customers look for. Start with the free Readiness Snapshot.",
  openGraph: { siteName: "RENZOLO", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
