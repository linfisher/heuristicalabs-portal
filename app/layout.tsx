import type { Metadata, Viewport } from "next";
import { Exo_2 } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-exo2",
});

export const metadata: Metadata = {
  title: "Heuristica Labs — Portal",
  description: "Private project access portal",
  robots: "noindex, nofollow",
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
    <ClerkProvider signInUrl="/portal/sign-in">
      <html lang="en" className={exo2.variable}>
        <body className="font-sans antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
