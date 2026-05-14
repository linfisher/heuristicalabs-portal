import type { Metadata, Viewport } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-exo2",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://heuristicalabs.com"),
  title: {
    default: "Heuristica Labs",
    template: "%s — Heuristica Labs",
  },
  description: "Heuristica Labs is an independent venture studio building bold, original technology companies from the ground up.",
  openGraph: {
    title: "Heuristica Labs",
    description: "Venture Studio. Bold Ideas. Real Products.",
    url: "/",
    siteName: "Heuristica Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Heuristica Labs",
    description: "Venture Studio. Bold Ideas. Real Products.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={exo2.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
