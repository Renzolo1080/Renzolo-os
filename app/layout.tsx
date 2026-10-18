import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Analytics } from "@/components/Analytics";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_APP_URL) ? process.env.NEXT_PUBLIC_APP_URL : "https://renzolo-os.vercel.app").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Founder Trajectory™ · Powered by RENZOLO OS™",
  description: "Venture Readiness Assessment and Development Support. Take the free 5-7 minute Readiness Snapshot and see where your business stands.",
  openGraph: {
    title: "Know exactly where your business stands",
    description: "Free 5-7 minute Readiness Snapshot: your Total Readiness Score, Strategic Plan Readiness and the three areas holding you back.",
    siteName: "Founder Trajectory™",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
