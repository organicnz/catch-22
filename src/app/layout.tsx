import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSettings } from "@/lib/supabase";
import { SettingsHydrator } from "@/components/account/SettingsHydrator";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
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
    images: [
      {
        url: 'https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Catch-22 | Built for the Elements',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ['https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/hero.jpg'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-secondary font-sans selection:bg-primary selection:text-secondary">
        <SettingsHydrator settings={settings} />
        <Header />
        <main className="flex-grow flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
