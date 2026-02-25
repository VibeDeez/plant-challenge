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
    process.env.NEXT_PUBLIC_SITE_URL || "https://plantmaxxing.com"
  ),
  title: "Plantmaxxing",
  description: "Track your weekly plant diversity and compete with family and friends",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Plantmaxxing",
  },
  openGraph: {
    title: "Plantmaxxing",
    description: "Track your weekly plant diversity. Feed your gut. Transform your health.",
    type: "website",
    images: [
      {
        url: "/opengraph-image?v=20260225",
        width: 1200,
        height: 630,
        alt: "Plantmaxxing — Become unmoggable",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plantmaxxing",
    description: "Track your weekly plant diversity. Feed your gut. Transform your health.",
    images: ["/opengraph-image?v=20260225"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a3a2a",
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
