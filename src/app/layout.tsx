import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { SettingsHydrator } from '@/components/account/SettingsHydrator';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getSettings } from '@/lib/supabase-server';
import Providers from './providers';

// TODO: Cache Components adoption — layout reads cookies for auth state; move the read
// behind <Suspense> (Header auth section) so the shell can prerender.

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

import type { UserSettings } from '@/lib/store/settings';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-secondary font-sans selection:bg-primary selection:text-secondary">
        <Providers>
          <SettingsHydrator settings={settings as UserSettings | null} />
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
