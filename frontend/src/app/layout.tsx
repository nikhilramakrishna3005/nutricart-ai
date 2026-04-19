import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ClientProviders } from "@/components/shared/ClientProviders";
import { SiteHeader } from "@/components/shared/SiteHeader";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NutriCart AI",
  description:
    "AI-powered nutrition and grocery planning within budget, diet, and store constraints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SiteHeader />
        <ClientProviders>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
