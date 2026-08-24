import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { SettingsHydrator } from '@/components/account/SettingsHydrator';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import type { UserSettings } from '@/lib/store/settings';
import { getSettings } from '@/lib/supabase-server';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Catch-22 | Built for the Elements',
  description:
    'Premium fishing gear and apparel. Tested in the harshest environments, designed for durability and performance. 2.5% of all profits donated to NZ Sea Cleaners.',
  keywords: ['fishing gear', 'fishing apparel', 'NZ fishing', 'braid', 'lures', 'sea cleaners'],
  openGraph: {
    title: 'Catch-22 | Built for the Elements',
    description: 'Premium fishing gear and apparel. Tested in the harshest environments.',
    url: 'https://catch-22.co.nz',
    siteName: 'Catch-22',
    locale: 'en_NZ',
    images: [
      {
        url: 'https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/thunder-charter.jpg',
        width: 1200,
        height: 630,
        alt: 'Catch-22 | Built for the Elements',
      },
    ],
  },
  twitter: {
    images: [
      'https://wcoaqlglwxwceqktpckt.supabase.co/storage/v1/object/public/media/site/thunder-charter.jpg',
    ],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

async function SettingsLoader() {
  const settings = await getSettings();
  return <SettingsHydrator settings={settings as UserSettings | null} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-secondary font-sans selection:bg-primary selection:text-secondary">
        <Providers>
          <Suspense fallback={null}>
            <SettingsLoader />
          </Suspense>
          <Header />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </Providers>
        <Toaster position="bottom-right" richColors theme="light" />
        <Analytics />
      </body>
    </html>
  );
}
