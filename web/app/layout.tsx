import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Scraper Dashboard",
  description: "Private job hunting dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
