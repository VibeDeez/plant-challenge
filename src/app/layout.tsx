import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://plant-challenge.onrender.com"
  ),
  title: "30 Plant Point Challenge",
  description: "Track your weekly plant diversity and compete with family and friends",
  openGraph: {
    title: "30 Plant Point Challenge",
    description: "Track your weekly plant diversity. Feed your gut. Transform your health.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "30 Plant Point Challenge",
    description: "Track your weekly plant diversity. Feed your gut. Transform your health.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-[var(--background)]">
        {children}
      </body>
    </html>
  );
}
