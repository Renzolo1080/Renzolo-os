import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RENZOLO OS",
  description: "Venture Readiness Assessment and Development Support",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
