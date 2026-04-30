import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Catch-22 | Built for the Elements",
  description: "Premium fishing gear and apparel. Tested in the harshest environments, designed for durability and performance. 2.5% of all profits donated to NZ Sea Cleaners.",
  keywords: ["fishing gear", "fishing apparel", "NZ fishing", "braid", "lures", "sea cleaners"],
  openGraph: {
    title: "Catch-22 | Built for the Elements",
    description: "Premium fishing gear and apparel. Tested in the harshest environments.",
    url: "https://catch-22.co.nz",
    siteName: "Catch-22",
    locale: "en_NZ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-secondary font-sans">
        <Header />
        <main className="flex-grow flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
