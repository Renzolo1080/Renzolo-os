import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://renzoloenterprises.com"),
  title: { default: "RENZOLO · Venture readiness for founders", template: "%s · RENZOLO" },
  description:
    "RENZOLO helps founders in the U.S., Kenya and South Africa see where their business stands and build a plan to grow, get funded and scale. Start with the free Readiness Snapshot.",
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
